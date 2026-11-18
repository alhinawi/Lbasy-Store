"use client";
import { api } from './account';
import type { Drop, Order, OrderStatus, Product, ShippingZone } from './types';
export const isDemo=false;
/** Resize a photo in the browser before upload: smaller files, faster store. */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/webp", quality));
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(b);
  });

export const adminApi = {
 async session():Promise<string|null>{
  const r=await fetch('/api/admin/session',{cache:'no-store'}).then(r=>r.json());
  if(r.authenticated)return 'store-admin';
  const me=await api<{user:{role:string;email:string}|null}>('/auth/me');return me.user?.role==='admin'?me.user.email:null;
 },
 async signIn(email:string,password:string):Promise<'ok'|'bad'|'not_admin'>{
  try{const r=await api<{user:{role:string}}>('/auth/login','POST',{email,password});return r.user.role==='admin'?'ok':'not_admin';}catch{return 'bad';}
 },
 async signOut(){await Promise.all([api('/auth/logout','POST'),fetch('/api/admin/session',{method:'DELETE'})]);},
 async products():Promise<Product[]>{return (await api<{items:Product[]}>('/admin/products')).items;},
 async saveProduct(p:Product & {published?:boolean}){await api('/admin/products','PUT',p);},
 async confirmInventory(id:string,revision:number,confirmed:boolean){await api('/admin/products/'+id+'/inventory','PATCH',{revision,confirmed});},
 async deleteProduct(_id:string){void _id;throw new Error('Data deletion needs the owner decision. Unpublish the product instead.');},
 async uploadImage(file:File,_folder:string):Promise<string>{void _folder;const blob=await resizeImage(file,1200,.78);if(blob.size>180000)throw new Error('Photo is too large. Choose a smaller photo (under 180 KB after resize).');return blobToDataUrl(blob);},
 async orders():Promise<Order[]>{return (await api<{items:Order[]}>('/admin/orders')).items;},
 async setOrderStatus(id:string,status:OrderStatus){await api('/admin/orders/'+id,'PATCH',{status});},
 async drops():Promise<Drop[]>{return (await api<{items:Drop[]}>('/admin/drops')).items;},
 async saveDrop(drop:Drop,originalSlug?:string){await api('/admin/drops','PUT',{drop,originalSlug});},
 async deleteDrop(_slug:string){void _slug;throw new Error('Data deletion needs the owner decision. Unpublish the drop instead.');},
 async shipping():Promise<ShippingZone[]>{return (await api<{items:ShippingZone[]}>('/admin/shipping')).items;},
 async saveShipping(zones:ShippingZone[]){await api('/admin/shipping','PUT',zones);},
 resetDemo(){throw new Error('Live store data cannot be reset.');}
};
