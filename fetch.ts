import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { account } from "./viem";

const fetchWithPayment = wrapFetchWithPayment(fetch, account);

const url = "http://localhost:8787/private/pin"

fetchWithPayment(url, { //url should be something like https://api.example.com/paid-endpoint
  method: "POST",
  body: JSON.stringify({
    buyer: account.address,
    fileSize: 500000
  })
})
  .then(async response => {
    const body = await response.json() as { url: string }
    console.log(body);

    const uuid = crypto.randomUUID()

    const file = new File([`Paid and pined by 402.pinata.cloud: ${uuid}`], "file.txt")

    const data = new FormData()
    data.append("network", "private")
    data.append("file", file)

    const uploadReq = await fetch(body.url, {
      method: "POST",
      body: data
    })

    const uploadRes = await uploadReq.json()
    console.log(uploadRes)
  })
  .catch(error => {
    console.error(error.response?.data?.error);
  });
