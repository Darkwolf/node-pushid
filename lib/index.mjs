import { randomInt } from 'crypto'
import {
  ObjectDefineProperties,
  FunctionPrototypeBind,
  FunctionPrototypeSymbolHasInstance,
  Symbol,
  SymbolIterator,
  SymbolToStringTag,
  SymbolSafeIterator,
  RangeError,
  SyntaxError,
  TypeError,
  NumberMAX_SAFE_INTEGER,
  MathFloor,
  DateNow,
  String,
  StringPrototypeIndexOf,
  StringPrototypeSafeSymbolIterator,
  Uint8Array,
  ReflectSetPrototypeOf,
  SafeGenerator,
  PrimitivesIsString,
  TypesToIntegerOrInfinity
} from '@darkwolf/primordials'

const encodingSymbol = Symbol('encoding')
const timestampSymbol = Symbol('timestamp')
const encodedTimestampSymbol = Symbol('encodedTimestamp')
const charsSymbol = Symbol('chars')
const generateSymbol = Symbol('generate')
class PushID {
  constructor(encoding = 'base64url') {
    const alphabet = getAlphabet(encoding)
    this[encodingSymbol] = encoding
    this[timestampSymbol] = null
    this[charsSymbol] = new Uint8Array(12)
  }

  get encoding() {
    return this[encodingSymbol]
  }

  get timestamp() {
    return this[timestampSymbol]
  }

  [generateSymbol]() {
    const encoding = this[encodingSymbol]
    const alphabet = getAlphabet(encoding)
    const {length} = alphabet
    const lastIndex = length - 1
    const chars = this[charsSymbol]
    let result = this[encodedTimestampSymbol]
    const timestamp = DateNow()
    if (this[timestampSymbol] !== timestamp) {
      this[timestampSymbol] = timestamp
      const encodedTimestamp = encodeTimestamp(timestamp, encoding)
      this[encodedTimestampSymbol] = encodedTimestamp
      result = encodedTimestamp
      for (let i = 0; i < 12; i++) {
        const index = randomInt(length)
        chars[i] = index
        result += alphabet[index]
      }
    } else {
      let index = 11
      for (; index >= 0 && chars[index] === lastIndex; index--) {
        chars[index] = 0
      }
      chars[index === -1 ? 11 : index]++
      for (let i = 0; i < 12; i++) {
        result += alphabet[chars[i]]
      }
    }
    return result
  }

  generate() {
    return this[generateSymbol]()
  }

  *[SymbolIterator]() {
    while (true) {
      yield this[generateSymbol]()
    }
  }

  [SymbolSafeIterator]() {
    return new SafeGenerator(this[SymbolIterator]())
  }
}

const isPushID = FunctionPrototypeBind(FunctionPrototypeSymbolHasInstance, null, PushID)

const alphabets = {
  base64url: '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
  base62: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  base58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
}
ReflectSetPrototypeOf(alphabets, null)

const getAlphabet = encoding => {
  const alphabet = alphabets[encoding]
  if (!alphabet) {
    throw new TypeError('The encoding must be "base64url", "base62" or "base58"')
  }
  return alphabet
}

const isUID = (value, encoding = 'base64url') => {
  if (!PrimitivesIsString(value) || value.length !== 20) {
    return false
  }
  const alphabet = getAlphabet(encoding)
  for (const char of StringPrototypeSafeSymbolIterator(value)) {
    if (StringPrototypeIndexOf(alphabet, char) === -1) {
      return false
    }
  }
  return true
}

const encodeTimestamp = (timestamp, encoding = 'base64url') => {
  timestamp = TypesToIntegerOrInfinity(timestamp)
  if (timestamp < 0) {
    throw new RangeError('The timestamp must be greater than or equal to zero')
  }
  if (timestamp > NumberMAX_SAFE_INTEGER) {
    throw new RangeError('The timestamp must be less than or equal to the maximum safe integer')
  }
  const alphabet = getAlphabet(encoding)
  const {length} = alphabet
  let result = ''
  for (let i = 0; i < 8; i++) {
    result = `${alphabet[timestamp % length]}${result}`
    timestamp = MathFloor(timestamp / length)
  }
  return result
}

const decodeTimestamp = (string, encoding = 'base64url') => {
  string = String(string)
  if (string.length < 8) {
    throw new RangeError('The length of the string must be greater than or equal to 8')
  }
  const alphabet = getAlphabet(encoding)
  const {length} = alphabet
  let result = 0
  for (let i = 0; i < 8; i++) {
    const char = string[i]
    const index = StringPrototypeIndexOf(alphabet, char)
    if (index === -1) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for ${encoding} encoding`)
    }
    result = result * length + index
  }
  return result
}

function* generator(encoding = 'base64url') {
  const alphabet = getAlphabet(encoding)
  const {length} = alphabet
  const lastIndex = length - 1
  const chars = new Uint8Array(12)
  let timestamp
  let encodedTimestamp
  while (true) {
    let result = encodedTimestamp
    const now = DateNow()
    if (timestamp !== now) {
      timestamp = now
      encodedTimestamp = encodeTimestamp(timestamp, encoding)
      result = encodedTimestamp
      for (let i = 0; i < 12; i++) {
        const index = randomInt(length)
        chars[i] = index
        result += alphabet[index]
      }
    } else {
      let index = 11
      for (; index >= 0 && chars[index] === lastIndex; index--) {
        chars[index] = 0
      }
      chars[index === -1 ? 11 : index]++
      for (let i = 0; i < 12; i++) {
        result += alphabet[chars[i]]
      }
    }
    yield result
  }
}
const safeGenerator = encoding => new SafeGenerator(generator(encoding))

ObjectDefineProperties(PushID, {
  isPushID: {
    value: isPushID
  },
  isUID: {
    value: isUID
  },
  encodeTimestamp: {
    value: encodeTimestamp
  },
  decodeTimestamp: {
    value: decodeTimestamp
  },
  generator: {
    value: generator
  },
  safeGenerator: {
    value: safeGenerator
  }
})
ObjectDefineProperties(PushID.prototype, {
  [SymbolToStringTag]: {
    value: 'PushID'
  }
})

export {
  isPushID,
  isUID,
  encodeTimestamp,
  decodeTimestamp,
  generator,
  safeGenerator
}
export default PushID
