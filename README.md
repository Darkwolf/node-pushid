# PushID
## Install
`npm i --save @darkwolf/pushid`
## Usage
```javascript
// ECMAScript
import PushID from '@darkwolf/pushid'
// CommonJS
const PushID = require('@darkwolf/pushid')

const generator = PushID.generator() // base64url encoding
generator.next() // => IteratorResult
const base62Generator = PushID.generator('base62')
base62Generator.next() // => IteratorResult
const base58Generator = PushID.generator('base58')
base58Generator.next() // => IteratorResult

const pushId = new PushID() // base64url encoding
pushId.timestamp // => null
const uid = pushId.generate() // => '-M_aLVkfh_UAGfe7mllM'
pushId.timestamp // => 1620919847979
PushID.decodeTimestamp(uid) // => 1620919847979
const base62PushId = new PushID('base62')
base62PushId.generate() // => '0SXJ0UdqW0bem6JGClMA'
const base58PushId = new PushID('base58')
base58PushId.generate() // => '1jaa8uoknTqzpegwD4WC'
```
## [API Documentation](https://github.com/Darkwolf/node-pushid/blob/master/docs/API.md)
## Contact Me
#### GitHub: [@PavelWolfDark](https://github.com/PavelWolfDark)
#### Telegram: [@PavelWolfDark](https://t.me/PavelWolfDark)
#### Email: [PavelWolfDark@gmail.com](mailto:PavelWolfDark@gmail.com)
