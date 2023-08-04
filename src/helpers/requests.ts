export async function throttleAsyncRequests(requests: any[], delay: number) {
  for (const request of requests) {
    await request();
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
