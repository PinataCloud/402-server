export const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account-Free IPFS Uploads From Pinata</title>
  <style>
    :root {
      --background: #16141f;
      --card-bg: #ffffff;
      --text-dark: #16141f;
      --text-light: #ffffff;
      --primary: #6b49eb;
      --primary-hover: #5a3dd4;
      --secondary: #56d9bf;
      --accent: #ffd166;
      --tertiary: #ff8ef5;
      --border-radius: 12px;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: var(--background);
      color: var(--text-light);
      line-height: 1.6;
      padding: 0;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      padding-bottom: 4rem;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
    }
    
    .logo {
      font-size: 1.8rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .logo-icon {
      width: 28px;
      height: 41px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .pinata-logo {
      width: 28px;
      height: 41px;
    }
    
    .main-section {
      background-color: var(--card-bg);
      border-radius: var(--border-radius);
      padding: 3rem;
      margin-top: 2rem;
      color: var(--text-dark);
      position: relative;
      overflow: hidden;
    }
    
    h1 {
      width: 50%;
      font-size: 3.5rem;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      max-width: 70%;
      font-weight: 800;
    }
    
    h3 {
      width: 50%;
      font-size: 1.25rem;
      font-weight: 400;
      margin-bottom: 2.5rem;
      max-width: 70%;
      color: #4a4a4a;
    }
    
    .features {
      width: 50%;
      margin-top: 2.5rem;
      margin-bottom: 2.5rem;
    }
    
    ul {
      list-style-type: none;
    }
    
    li {
      margin-bottom: 1rem;
      position: relative;
      padding-left: 1.5rem;
      font-size: 1.1rem;
    }
    
    li:before {
      content: "→";
      color: var(--primary);
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .btn {
      cursor: pointer;
      padding: 0.75rem 1.5rem;
      border-radius: 9999px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      font-size: 1rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: var(--text-light);
      border: none;
      cursor: pointer;
    }
    
    .btn-primary:hover {
      background-color: var(--primary-hover);
    }
    
    .btn-secondary {
      background-color: var(--secondary);
      color: var(--text-dark);
      border: none;
    }
    
    .btn-tertiary {
      background-color: var(--tertiary);
      color: var(--text-dark);
      border: none;
    }
    
    .btn-outline {
      background-color: transparent;
      color: var(--text-dark);
      border: 2px solid #e0e0e0;
    }
    
    .btn-outline:hover {
      border-color: #b0b0b0;
    }
    
    .trusted-section {
      margin-top: 4rem;
      text-align: center;
    }
    
    .trusted-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      letter-spacing: 0.05em;
      font-weight: 700;
    }
    
    .decoration {
      position: absolute;
      width: 200px;
      height: 200px;
      z-index: 0;
    }
    
    .decoration.top-right {
      top: -40px;
      right: -40px;
      background-color: var(--secondary);
      opacity: 0.2;
      border-radius: 50%;
    }
    
    .decoration.bottom-left {
      bottom: -70px;
      left: -70px;
      background-color: var(--primary);
      opacity: 0.2;
      border-radius: 40%;
      width: 250px;
      height: 250px;
    }
    
    .pinata-mascot {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      width: 45%;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .pinata-mascot-inner {
      width: 100%;
      height: 100%;
      background-color: #1d1a27;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .mascot-detail {
      position: absolute;
    }
    
    .mascot-detail.dots {
      top: 15px;
      left: 15px;
      display: flex;
      gap: 8px;
    }
    
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .dot-red {
      background-color: #ff5f56;
    }
    
    .dot-yellow {
      background-color: #ffbd2e;
    }
    
    .dot-green {
      background-color: #27c93f;
    }
    
    .terminal-content {
      margin-top: 30px;
      padding: 10px 15px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 11px;
      color: #56d9bf;
      overflow: auto;
      height: calc(100% - 30px);
      width: 100%;
      white-space: pre;
      line-height: 1.4;
      text-align: left;
    }
    
    .terminal-content .comment {
      color: #777;
    }
    
    .terminal-content .keyword {
      color: #ff8ef5;
    }
    
    .terminal-content .string {
      color: #ffd166;
    }
    
    .terminal-content .function {
      color: #56d9bf;
    }
    
    .terminal-content .method {
      color: #6b49eb;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2.5rem;
        max-width: 100%;
        width: 100%;
      }
      
      h3 {
        max-width: 100%;
        width: 100%;
      }
      
      .features {
        width: 100%;
      }
      
      .pinata-mascot {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg class="pinata-logo" xmlns="http://www.w3.org/2000/svg" width="28" height="41" viewBox="0 0 200 286" fill="none">
          <path fill="#CE3F8F" d="m75.817 236.273 9.652 19.8H26.777l9.6-19.8h-9.6l9.785-20.18h39.069l9.838 20.18h-9.652z"/>
          <path fill="#6D3AC6" d="M37.001 256.072h38.246v10.324c0 10.555-8.573 19.128-19.127 19.128-10.555 0-19.128-8.573-19.128-19.128v-10.324h.009z"/>
          <path fill="#CE3F8F" d="m156.532 236.275 9.661 19.8h-58.701l9.599-19.8h-9.599l9.785-20.18h39.069l9.847 20.18h-9.661z"/>
          <path fill="#6D3AC6" d="M117.716 256.074h38.246v10.325c0 10.554-8.573 19.127-19.128 19.127-10.554 0-19.127-8.573-19.127-19.127v-10.325h.009z"/>
          <path fill="#FD0" d="m155.148 194.372 14.748 21.719H23.078l14.677-21.764H23.078l14.677-22.055h-9.784l9.784-21.968 39.087 5.698 78.306-.221 9.696 16.491h-9.732l.036.044 14.748 22.011h-14.784l.036.045z"/>
          <path fill="#000" d="m34.594 177.025 8.06 7.582 13.695-12.917 13.306 13.209 13.59-12.917 13.597 12.917 13.307-13.209 13.598 12.917 13.695-13.014 2.539 2.53 8.723 8.237 8.113-7.538 3.15 4.689-11.166 11.165-.07-.071-11.484-11.386-13.598 13.598-13.598-13.598-13.598 13.598-13.306-13.297-13.598 12.908-13.2-13.112-13.598 13.598-11.368-11.067"/>
          <path fill="#6D3AC6" d="M37.743 150.307c0-6.247-1.142-14.474-4.079-19.172-3.91-6.264-10.953-10.564-24.648-10.661l-.194 7.83c4.892-.195 9.59.292 13.598 2.84 3.423 2.15 6.263 5.671 8.413 11.545-11.935-4.105-18.782-2.84-23.577.292-2.54 1.663-4.504 3.716-6.361 5.963l5.379 4.99c.292-.487.68-.885.982-1.274 5.865-6.945 12.616-6.75 19.764-2.937-15.553 7.431-18.004 20.543-17.216 30.036.68.097 7.626 0 7.626 0-.681-9.193 4.892-21.826 18.587-25.551l1.726-3.901z"/>
          <path fill="#1DB9D2" d="m159.962 155.88-82.985.115 7.325-22.719h-7.255l7.255-19.561h68.361l7.299 19.658h-7.299l7.299 22.507z"/>
          <path fill="#FD0" d="m163.004 113.821-87.754.098L89.6 84.467h-9.74l14.438-28.364 68.706 15.058v42.66z"/>
          <path fill="#CE3F8F" d="M163 113.82V71.168s25.258 5.689 30.691 19.747c.389 1.017.557 2.105.557 3.194C195.265 113.236 163 113.82 163 113.82z"/>
          <path fill="#008599" d="M141.473 66.444c22.984-31.894 34.353-47.66 25.258-55.392-5.963-5.087-14.748-.787-27.859 8.998-.487 10.466-2.256 24.842-5.583 44.598l8.184 1.796z"/>
          <path fill="#1DB9D2" d="M131.893.685c-12.421-3.034-19.596 16.872-37.6 55.418l40.051 8.777c3.326-19.765 5.158-34.212 5.087-45.412.486-11.254-1.469-17.314-7.529-18.783h-.009z"/>
          <path fill="#fff" d="M136.31 95.147a9.2 9.2 0 0 0 9.201-9.2 9.201 9.201 0 1 0-9.201 9.201z"/>
          <path fill="#000" d="M136.317 90.395a4.45 4.45 0 1 0 0-8.9 4.45 4.45 0 0 0 0 8.9zm26.685 21.78v1.636h-5.22l-11.298-4.883c-.876-.345-2.017-1.619-1.539-2.539.283-.567 1.415-1.239 3.238-.522l14.819 6.308z"/>
        </svg>
      </div>
      Pinata
    </div>
  </header>

  <div class="container">
    <main class="main-section">
      <div class="decoration top-right"></div>
      <div class="decoration bottom-left"></div>
      
      <h1>Account-Free IPFS Uploads From Pinata</h1>
      
      <h3>Use crypto to pay for private and public IPFS uploads without creating an account or using an API key</h3>
      
      <div class="features">
        <ul>
          <li>Leverages Coinbase's x402 Protocol</li>
          <li>Public IPFS content available on public gateways or your own Dedicated IPFS Gateway</li>
          <li>Pay to retrieve private IPFS content</li>
        </ul>
      </div>
      
      <div class="button-group">
        <a href="https://app.pinata.cloud" class="btn btn-primary">Want a Pinata account?</a>
        <a href="https://docs.pinata.cloud/files/x402" class="btn btn-outline">Full Docs</a>
      </div>
      
      <div class="pinata-mascot">
        <div class="pinata-mascot-inner">
          <div class="mascot-detail dots">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
          </div>
          <div class="terminal-content">
<span class="comment">// Asynchronous function to upload a private file with payment</span>
(<span class="keyword">async</span> () => {
  <span class="keyword">try</span> {
    <span class="keyword">const</span> response = <span class="keyword">await</span> <span class="function">fetchWithPayment</span>(
      <span class="string">\`https://402.pinata.cloud/v1/pin/private\`</span>,
      {
        method: <span class="string">"POST"</span>,
        headers: {
          <span class="string">"Content-Type"</span>: <span class="string">"application/json"</span>,
        },
        body: <span class="method">JSON.stringify</span>({
          fileSize: <span class="keyword">SIZE</span>, <span class="comment">// The size of the file you'll be uploading</span>
        }),
      }
    );

    <span class="keyword">const</span> urlData = <span class="keyword">await</span> response.<span class="method">json</span>();
    <span class="keyword">const</span> file = <span class="keyword">new</span> <span class="function">File</span>([<span class="method">Date.now</span>().<span class="method">toString</span>()], <span class="string">"hello.txt"</span>, { type: <span class="string">"text/plain"</span> })
    <span class="keyword">const</span> upload = <span class="keyword">await</span> pinata.upload.private.file(file).url(urlData.url);
    <span class="method">console.log</span>(upload)
  } <span class="keyword">catch</span> (error) {
    <span class="method">console.error</span>(error);
  }
})();</div>
        </div>
      </div>
    </main>        
  </div>
</body>
</html>`;