
## ✅ **Setup**

Install the library:

```bash
npm install @stellar/freighter-api
```

Import the whole library or only what you need:

```js
// Whole
import freighterApi from "@stellar/freighter-api";

// Modular
import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  getNetworkDetails,
  signTransaction,
  signMessage,
  signAuthEntry,
  signBlob,
} from "@stellar/freighter-api";
```

---

## 🔍 **Connection and Permissions**

### `isConnected()`

Check if Freighter is installed:

```js
const { isConnected } = await isConnected();
if (isConnected) alert("User has Freighter!");
```

### `isAllowed()`

Check if the user authorized your app:

```js
const { isAllowed } = await isAllowed();
if (isAllowed) alert("App is authorized!");
```

### `setAllowed()`

Prompt user to allow your app:

```js
const { isAllowed } = await setAllowed();
if (isAllowed) alert("App added to allow list!");
```

### `requestAccess()`

Prompt and get user's public key:

```js
const { address, error } = await requestAccess();
if (error) console.error(error);
else console.log("Public Key:", address);
```

---

## 📬 **Get Account Info**

### `getAddress()`

Get public key silently (only if previously allowed):

```js
const { address, error } = await getAddress();
```

---

## 🌐 **Network Info**

### `getNetwork()`

```js
const { network, networkPassphrase } = await getNetwork();
```

### `getNetworkDetails()`

```js
const details = await getNetworkDetails();
console.log(details.networkUrl, details.sorobanRpcUrl);
```

---

## ✍️ **Signing**

### `signTransaction(xdr, opts)`

Sign a transaction XDR:

```js
const signed = await signTransaction(xdr, {
  network: "TESTNET",  // or "PUBLIC"
  address: userAddress,
});
console.log("Signed XDR:", signed.signedTxXdr);
```

### `signAuthEntry(authEntryXdr, opts)`

```js
const signedAuth = await signAuthEntry(authEntryXdr, { address: userAddress });
```

### `signMessage(message, opts)`

```js
const result = await signMessage("Hello World", { address: userAddress });
console.log(result.signedMessage);
```

---

## 🚀 **Submitting Signed Transaction to Horizon**

```js
import { Server, TransactionBuilder } from "stellar-sdk";

const server = new Server("https://horizon-testnet.stellar.org");

const tx = TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);

server.submitTransaction(tx)
  .then(response => console.log("Transaction successful:", response))
  .catch(error => console.error("Submission failed:", error));
```

---

## ✅ Suggested Flow for Your Web App

1. Check if Freighter is connected (`isConnected`)
2. Ask for access (`requestAccess`)
3. Get public key (`getAddress`)
4. Show network (`getNetworkDetails`)
5. Prepare transaction (using Stellar SDK)
6. Sign with `signTransaction`
7. Submit to Horizon

---