// Compatibility endpoint, now authenticated and backed by the same atomic D1 order flow.
import { POST as backend } from '../backend/[[...route]]/route';
export async function POST(req:Request) {
 const url=new URL(req.url); url.pathname='/api/backend/account/orders';
 return backend(new Request(url,req));
}
