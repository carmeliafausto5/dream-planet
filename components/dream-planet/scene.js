// Geometry and interaction are shared by the browser, App WebView and WeChat canvas.
const TAU = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const clamp = (n, low, high) => Math.max(low, Math.min(high, n))
const dots = ['#adfff0', '#ffcf9e', '#f8cfea', '#d9d1ff']

function circle(ctx, x, y, r, paint) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fillStyle = paint
  ctx.fill()
}

function polygon(ctx, points, paint) {
  ctx.beginPath()
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath()
  ctx.fillStyle = paint
  ctx.fill()
}

function gradient(ctx, x, y, radius, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  stops.forEach(([offset, color]) => g.addColorStop(offset, color))
  return g
}

function sparkle(ctx, x, y, r) {
  polygon(ctx, [[x, y-r], [x+r*.16, y-r*.16], [x+r*.74, y],
    [x+r*.16, y+r*.16], [x, y+r], [x-r*.16, y+r*.16],
    [x-r*.74, y], [x-r*.16, y-r*.16]], '#fff')
}

function spherePoint(latitude, longitude) {
  return [Math.cos(latitude)*Math.cos(longitude), Math.sin(latitude),
    Math.cos(latitude)*Math.sin(longitude)]
}

function surfacePoint(i, count) {
  return spherePoint(Math.asin(1 - 2*(i+.5)/count), i*GOLDEN_ANGLE)
}

function unit(x, y, z) {
  const length = Math.hypot(x,y,z)
  return [x/length,y/length,z/length]
}

// Stagger adjacent rings to form a brilliant cut. Share the vertices so each
// point is projected just once per frame, including at the poles.
function makeCrystal(bands, sides) {
  const vertices = [[0,-1,0]]
  const faces = []
  for (let row=1; row<bands; row++) {
    const latitude = Math.PI*(row/bands-.5)
    for (let col=0; col<sides; col++) {
      vertices.push(spherePoint(latitude, TAU*(col+.5*(row%2))/sides))
    }
  }
  vertices.push([0,1,0])
  const index = (row,col) => {
    if (row===0) return 0
    if (row===bands) return vertices.length-1
    return 1+(row-1)*sides+(col+sides)%sides
  }
  function add(a,b,c) {
    if (a===b || b===c || a===c) return
    const [p,q,s] = [vertices[a],vertices[b],vertices[c]]
    const [ux,uy,uz] = q.map((v,i)=>v-p[i])
    const [vx,vy,vz] = s.map((v,i)=>v-p[i])
    const normal = unit(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)
    if (normal.reduce((sum,v,i)=>sum+v*p[i],0)<0) normal.forEach((v,i)=>{normal[i]=-v})
    faces.push({a,b,c,normal})
  }
  for (let row=0; row<bands; row++) {
    for (let col=0; col<sides; col++) {
      const a=index(row,col), b=index(row,col+1)
      const c=index(row+1,col), d=index(row+1,col+1)
      if (row%2) { add(a,b,d); add(a,d,c) }
      else { add(a,b,c); add(b,d,c) }
    }
  }
  return {vertices,faces}
}

const crystal = makeCrystal(12,24)

// Sample a studio environment in the reflected view direction. A softbox,
// a dark flag and two coloured strips make neighbouring facets reflect
// distinct tones; the lights stay still while the gem rotates beneath them.
function facetReflection(nx,ny,nz) {
  const x=2*nx*nz, y=2*ny*nz, z=2*nz*nz-1
  const strip = (distance,spread) => clamp(1-Math.abs(distance)/spread,0,1)
  const softbox = clamp((.15-y)*5,0,1)*strip(x+.34*z+.30,.42)
  const lilac = strip(y-.44*x-.32*z+.13,.36)
  const ice = strip(x-.55*z-.56,.24)*clamp(.8-y,0,1)
  const flag = strip(y+.52*x+.30*z-.08,.33)
  const shine = softbox*.92 + ice*.72
  const fresnel = (1-nz)**3
  const red = 186+shine*74+lilac*30-flag*81
  const green = 171+shine*92+lilac*5-flag*85
  const blue = 225+shine*33+lilac*19-flag*42
  return 'rgba('+Math.round(clamp(red,0,255))+','+Math.round(clamp(green,0,255))+','+
    Math.round(clamp(blue,0,255))+','+Math.min(.95,.25+.50*fresnel+.40*shine+.19*flag)+')'
}
const stardust = Array.from({length: 112}, (_, i) => surfacePoint(i,112))

export function createScene(canvas, onPick) {
  const ctx = canvas.getContext('2d')
  let width = 0, height = 0, pixelRatio = 1
  let yaw = .58, pitch = .22, zoom = 1
  let labels = [], hits = [], gesture = null, lastTime = 0

  function draw(time = 0) {
    if (!width || !height) return
    if (!gesture && lastTime) yaw += Math.min(Math.max(time-lastTime,0),60)*.000075
    lastTime = time
    const r = Math.min(width*.304, height*.284)*zoom
    const cx = width*.5, cy = height*.50
    const ca = Math.cos(yaw), sa = Math.sin(yaw)
    const cb = Math.cos(pitch), sb = Math.sin(pitch)
    function rotate([x,y,z]) {
      const u = x*ca-z*sa, v = x*sa+z*ca
      return [u, y*cb+v*sb, v*cb-y*sb]
    }
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0)
    ctx.clearRect(0,0,width,height)
    ctx.save()
    ctx.translate(cx,cy)
    ctx.scale(r,r)

    // The ring orbits in the equatorial plane. Positive depth is in front.
    // Its axial tilt is constant; dragging vertically changes its apparent opening.
    const tilt = .28
    const ringPoint = (a, radius, bevel=0) => {
      const x = Math.cos(a)*radius
      const y = Math.sin(a)*radius*sb+bevel
      return [x*Math.cos(tilt)-y*Math.sin(tilt),x*Math.sin(tilt)+y*Math.cos(tilt)]
    }
    function ringHalf(start) {
      const steps = 64
      const arc = (radius, startAngle, endAngle, offset=0) =>
        Array.from({length:steps+1}, (_,i) => ringPoint(startAngle+(endAngle-startAngle)*i/steps,radius,offset))
      const end = start + Math.PI
      function strip(outer,inner,color,outerOffset=0,innerOffset=0) {
        polygon(ctx,arc(outer,start,end,outerOffset).concat(arc(inner,end,start,innerOffset)),color)
      }
      const sheen = ctx.createLinearGradient(-1.5,0,1.5,.35)
      ;[[0,'#f9ebff'],[.12,'#9890eb'],[.27,'#e5d2ff'],[.46,'#afa8f5'],
        [.65,'#cad5ff'],[.84,'#e8beee'],[1,'#fff7ff']].forEach(([s,c])=>sheen.addColorStop(s,c))
      strip(1.53,1.53,'#9685ce',.039,0)
      strip(1.53,1.27,sheen)
      strip(1.53,1.516,'#fff7ff')
      strip(1.455,1.435,'rgba(255,255,255,.62)')
      strip(1.325,1.29,'#c2b3ec')
      strip(1.29,1.27,'#fff7ff')
      for(let i=0;i<steps;i++) {
        const a = start+Math.PI*i/steps, b=a+Math.PI/steps
        const light = Math.sin(i*2.3+yaw*2)
        polygon(ctx,[ringPoint(a,1.53),ringPoint(b,1.53),ringPoint(b,1.53,.038),ringPoint(a,1.53,.038)],
          light>.45 ? '#f5eaff' : light<-.45 ? '#9182c6' : '#c4b8e9')
      }
    }
    ringHalf(Math.PI)
    // Glass body: tinted core, broad studio reflections and a cut crystal shell.
    const body = ctx.createLinearGradient(-.8,-1,.65,1)
    ;[[0,'rgba(250,250,255,.82)'],[.17,'rgba(204,222,252,.80)'],[.43,'rgba(169,147,231,.77)'],
      [.64,'rgba(158,132,210,.83)'],[.85,'rgba(228,196,237,.76)'],[1,'rgba(245,242,255,.85)']]
      .forEach(([s,c])=>body.addColorStop(s,c))
    circle(ctx,0,0,1,body)
    ctx.save()
    ctx.beginPath()
    ctx.arc(0,0,1,0,TAU)
    ctx.clip()
    circle(ctx,-.18,-.07,.98,gradient(ctx,-.18,-.07,.98,[[0,'rgba(114,93,224,.48)'],[1,'rgba(125,100,217,0)']]))
    const projectedCuts = crystal.vertices.map(rotate)
    const normals = crystal.faces.map(face=>rotate(face.normal))
    // Rear cuts appear smaller through the core. Their faint cyan and pink
    // reflections move in parallax underneath the polished front surface.
    ctx.save()
    ctx.translate(.025,.06)
    ctx.scale(.91,.90)
    crystal.faces.forEach(({a,b,c},i)=>{
      const [x,y,z]=normals[i]
      if (z>=0) return
      const band=Math.cos(8*x-6*y+4*z)
      if (band>.40 || band<-.60) {
        ctx.globalAlpha=.08+.25*Math.abs(band)**4
        polygon(ctx,[projectedCuts[a],projectedCuts[b],projectedCuts[c]],
          band>0 ? '#ddf9ff' : '#a088ca')
      }
    })
    ctx.restore()
    crystal.faces.forEach(({a,b,c},i)=>{
      const [nx,ny,nz]=normals[i]
      if (nz<=0) return
      polygon(ctx,[projectedCuts[a],projectedCuts[b],projectedCuts[c]],facetReflection(nx,ny,nz))
    })
    const rim = ctx.createRadialGradient(-.055,.03,.68,0,0,1)
    ;[[0,'rgba(255,255,255,0)'],[.54,'rgba(250,231,255,.03)'],
      [.80,'rgba(236,244,255,.28)'],[.94,'rgba(255,251,255,.69)'],[1,'rgba(193,177,227,.78)']]
      .forEach(([s,c])=>rim.addColorStop(s,c))
    circle(ctx,0,0,1,rim)
    // Curved highlights follow the surface instead of moving with the labels.
    function reflection(path, paint) {
      ctx.beginPath()
      ctx.moveTo(...path[0])
      path.slice(1).forEach(args=>ctx.bezierCurveTo(...args))
      ctx.fillStyle = paint
      ctx.fill()
    }
    reflection([[-.87,.03],[-.79,-.44,-.50,-.79,-.31,-.84],[-.55,-.57,-.68,-.27,-.73,.10],[-.79,.12,-.82,.10,-.87,.03]],'rgba(255,242,255,.35)')
    reflection([[.10,-.93],[.48,-1.02,.89,-.69,.93,-.28],[.74,-.52,.53,-.68,.24,-.69],[.18,-.76,.13,-.85,.10,-.93]],'rgba(255,255,248,.47)')
    reflection([[.88,-.51],[1.01,-.25,1.04,-.07,.96,.18],[.89,.23,.86,.23,.81,.22],[.90,-.03,.93,-.29,.88,-.51]],'rgba(255,246,229,.75)')
    stardust.forEach((point,i)=>{
      const [x,y,z] = rotate(point)
      if (z<0) return
      ctx.globalAlpha = .22+.62*z
      if(i%13===0) sparkle(ctx,x*.96,y*.96,.027)
      else circle(ctx,x*.96,y*.96,.003+(i%4)*.0015,'#fff')
    })
    ctx.restore()
    ringHalf(0)
    ctx.restore()

    const font = clamp(Math.min(width,height)*.023,11,15)
    hits = []
    const projected = labels.map(label => {
      const [x,y,z] = rotate(label.point)
      const distance = 1.30 + label.altitude
      // Match the tilted equator and give nearer stars slightly more perspective.
      const size = r*distance*(1+.065*z)
      return {...label,z,x:cx+size*(x*Math.cos(tilt)-y*Math.sin(tilt)),
        y:cy+size*(x*Math.sin(tilt)+y*Math.cos(tilt))}
    }).sort((a,b)=>a.z-b.z)
    for (const {id,index,z,x,y} of projected) {
      if (x<2 || x>width-2 || y<2 || y>height-2) continue
      const depth = (z+1)/2
      ctx.globalAlpha = .60+.40*depth
      circle(ctx,x,y,2+depth*2.3,dots[index%dots.length])
      hits.push({id,x,y,depth})
    }
    // Reserve space for near names first. In a crowded patch the far user's
    // star stays visible and selectable, even when its name cannot fit.
    const boxes = []
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    for (let i=hits.length-1; i>=0; i--) {
      const hit = hits[i]
      const size = font*(.90+.16*hit.depth)
      ctx.font = '500 '+size+'px "Microsoft YaHei", "PingFang SC", sans-serif'
      const half = ctx.measureText(hit.id).width/2+2
      const center = clamp(hit.x,half+2,width-half-2)
      for (const side of [-1,1]) {
        const y = hit.y+side*(size/2+5)
        const box = {left:center-half,right:center+half,top:y-size/2-1,bottom:y+size/2+1}
        if (box.top<0 || box.bottom>height || boxes.some(other=>
          box.left<other.right+2 && box.right>other.left-2 &&
          box.top<other.bottom+2 && box.bottom>other.top-2)) continue
        boxes.push(box)
        hit.box = box
        ctx.globalAlpha = .62+.38*hit.depth
        ctx.lineWidth = 2.2
        ctx.strokeStyle = 'rgba(247,243,255,.76)'
        ctx.strokeText(hit.id,center,y)
        ctx.fillStyle = '#3c345b'
        ctx.fillText(hit.id,center,y)
        break
      }
    }
    ctx.globalAlpha = 1
  }

  return {
    resize(w,h,dpr) {
      width=w; height=h; pixelRatio=clamp(dpr||1,1,2)
      canvas.width=Math.round(w*pixelRatio); canvas.height=Math.round(h*pixelRatio)
      draw()
    },
    setIds(ids) {
      labels=ids.map((id,i)=>({id,index:i,point:surfacePoint(i,ids.length),altitude:(i%4)*.035}))
      draw()
    },
    draw,
    begin(points) {
      if(!points.length) return
      const [p,q] = points
      gesture = {start:p, previous:p, moved:Boolean(q)||Boolean(gesture?.moved),
        gap:q ? Math.hypot(q.x-p.x,q.y-p.y) : 0}
    },
    move(points) {
      if(!gesture || !points.length) return
      const [p,q] = points
      if(q) {
        const gap = Math.hypot(q.x-p.x,q.y-p.y)
        if(gesture.gap>0) zoom=clamp(zoom*gap/gesture.gap,.65,1.65)
        gesture.gap=gap; gesture.moved=true
      } else {
        if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>4) gesture.moved=true
        if(gesture.moved) {
          yaw+=(p.x-gesture.previous.x)*.008
          pitch=clamp(pitch+(p.y-gesture.previous.y)*.006,-1.1,1.1)
        }
      }
      gesture.previous=p
    },
    end(remaining,point,cancelled=false) {
      if(!gesture) return
      if(remaining.length) {this.begin(remaining); return}
      if(!cancelled && !gesture.moved && point && Math.hypot(point.x-gesture.start.x,point.y-gesture.start.y)<8) {
        const nearest = hits.slice().sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0]
        const name = hits.find(({box})=>box && point.x>=box.left && point.x<=box.right &&
          point.y>=box.top && point.y<=box.bottom)
        const hit = name || (nearest && Math.hypot(nearest.x-point.x, nearest.y-point.y)<=11 ? nearest : null)
        if(hit) onPick(hit.id)
      }
      gesture=null
    },
    wheel(delta) {zoom=clamp(zoom*Math.exp(-clamp(delta,-240,240)*.0015),.65,1.65)}
  }
}
