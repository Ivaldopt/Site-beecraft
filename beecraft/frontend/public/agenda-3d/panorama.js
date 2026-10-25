// Perspective lookup into the same 360-degree room texture used by WebGL.
// This keeps the camera movement visible when GPU rendering is unavailable.
export function paintPanorama(renderer,scene,camera){
 const ctx=renderer.ctx,W=renderer.w,H=renderer.h,source=scene.userData.panorama;
 if(!source){if(scene.background?.isColor){ctx.fillStyle=scene.background.getStyle();ctx.fillRect(0,0,W,H)}return}
 let cache=renderer.panoramaCache;
 if(!cache||cache.source!==source){const src=document.createElement('canvas');src.width=Math.min(2048,source.width);src.height=Math.round(src.width*source.height/source.width);const s=src.getContext('2d',{willReadFrequently:true});s.drawImage(source,0,0,src.width,src.height);cache=renderer.panoramaCache={source,src:s.getImageData(0,0,src.width,src.height),canvas:document.createElement('canvas'),key:''}}
 const q=camera.quaternion,sw=Math.ceil(W/2.2),sh=Math.ceil(H/2.2),key=[sw,sh,q.x.toFixed(5),q.y.toFixed(5),q.z.toFixed(5),q.w.toFixed(5),camera.fov].join(',');
 if(cache.key!==key){cache.key=key;cache.canvas.width=sw;cache.canvas.height=sh;const dest=cache.canvas.getContext('2d'),data=dest.createImageData(sw,sh),pixels=cache.src.data,tw=cache.src.width,th=cache.src.height,tan=Math.tan(camera.fov*Math.PI/360),aspect=camera.aspect;
 const xx=q.x*q.x,yy=q.y*q.y,zz=q.z*q.z,xy=q.x*q.y,xz=q.x*q.z,yz=q.y*q.z,wx=q.w*q.x,wy=q.w*q.y,wz=q.w*q.z;
 const m00=1-2*(yy+zz),m01=2*(xy-wz),m02=2*(xz+wy),m10=2*(xy+wz),m11=1-2*(xx+zz),m12=2*(yz-wx),m20=2*(xz-wy),m21=2*(yz+wx),m22=1-2*(xx+yy);
 for(let y=0;y<sh;y++){const cy=(1-2*(y+.5)/sh)*tan;for(let x=0;x<sw;x++){const cx=(2*(x+.5)/sw-1)*tan*aspect,dx=m00*cx+m01*cy-m02,dy=m10*cx+m11*cy-m12,dz=m20*cx+m21*cy-m22,len=Math.sqrt(dx*dx+dy*dy+dz*dz);let u=.5+Math.atan2(dz,dx)/(2*Math.PI),v=.5-Math.asin(Math.max(-1,Math.min(1,dy/len)))/Math.PI;u=(u%1+1)%1;const sx=Math.min(tw-1,Math.floor(u*tw)),sy=Math.min(th-1,Math.max(0,Math.floor(v*th))),i=(sy*tw+sx)*4,j=(y*sw+x)*4;data.data[j]=pixels[i];data.data[j+1]=pixels[i+1];data.data[j+2]=pixels[i+2];data.data[j+3]=255}}dest.putImageData(data,0,0)}
 ctx.drawImage(cache.canvas,0,0,W,H);
}
