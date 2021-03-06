'use strict'
const { randomInt } = require('crypto')
const {
  ObjectCreate,
  ObjectDefineProperties,
  ObjectEntries,
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
  StringPrototypeSafeSymbolIterator,
  ArrayPrototypeForEach,
  Uint8Array,
  ReflectSetPrototypeOf,
  SafeGenerator,
  PrimitivesIsString,
  TypesToIntegerOrInfinity
} = require('@darkwolf/primordials')

const encodingSymbol = Symbol('encoding')
const timestampSymbol = Symbol('timestamp')
const encodedTimestampSymbol = Symbol('encodedTimestamp')
const charsSymbol = Symbol('chars')
const generateSymbol = Symbol('generate')

const UID_LENGTH = 20
const UID_TIMESTAMP_LENGTH = 8

const ENCODING = 'base64url'

const getEncodings = () => [
  'base64url',
  'base62',
  'base58',
  'base36'
]

const alphabets = {
  base64url: '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
  base62: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  base58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  base36: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
}
ReflectSetPrototypeOf(alphabets, null)

const alphabetLookups = ObjectCreate(null)
ArrayPrototypeForEach(ObjectEntries(alphabets), ([encoding, alphabet]) => {
  const {length} = alphabet
  const lookup = ObjectCreate(null)
  for (let i = 0; i < length; i++) {
    const char = alphabet[i]
    lookup[char] = i
  }
  alphabetLookups[encoding] = lookup
})

const isEncoding = value => PrimitivesIsString(value) && alphabets[value] !== undefined

const toEncoding = value => {
  if (value === undefined) {
    return ENCODING
  }
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The encoding must be a string')
  }
  if (alphabets[value] === undefined) {
    throw new TypeError('The encoding must be "base64url", "base62", "base58" or "base36"')
  }
  return value
}

const isUID = (value, encoding) => {
  encoding = toEncoding(encoding)
  if (!PrimitivesIsString(value) || value.length !== UID_LENGTH) {
    return false
  }
  const alphabetLookup = alphabetLookups[encoding]
  for (const char of StringPrototypeSafeSymbolIterator(value)) {
    if (alphabetLookup[char] === undefined) {
      return false
    }
  }
  return true
}

const _encodeTimestamp = (timestamp, alphabet) => {
  const {length} = alphabet
  let result = ''
  for (let i = 0; i < UID_TIMESTAMP_LENGTH; i++) {
    result = `${alphabet[timestamp % length]}${result}`
    timestamp = MathFloor(timestamp / length)
  }
  return result
}
const encodeTimestamp = (timestamp, encoding) => {
  encoding = toEncoding(encoding)
  timestamp = TypesToIntegerOrInfinity(timestamp)
  if (timestamp < 0) {
    throw new RangeError('The timestamp must be greater than or equal to zero')
  }
  if (timestamp > NumberMAX_SAFE_INTEGER) {
    throw new RangeError('The timestamp must be less than or equal to the maximum safe integer')
  }
  return _encodeTimestamp(timestamp, alphabets[encoding])
}

const decodeTimestamp = (string, encoding) => {
  encoding = toEncoding(encoding)
  string = String(string)
  if (string.length < UID_TIMESTAMP_LENGTH) {
    throw new RangeError('The length of the string must be greater than or equal to 8')
  }
  const alphabet = alphabets[encoding]
  const {length} = alphabet
  const alphabetLookup = alphabetLookups[encoding]
  let result = 0
  for (let i = 0; i < UID_TIMESTAMP_LENGTH; i++) {
    const char = string[i]
    const index = alphabetLookup[char]
    if (index === undefined) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for ${encoding} encoding`)
    }
    result = result * length + index
  }
  return result
}

function* generator(encoding) {
  encoding = toEncoding(encoding)
  const alphabet = alphabets[encoding]
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
      encodedTimestamp = _encodeTimestamp(timestamp, alphabet)
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
        const index = chars[i]
        result += alphabet[index]
      }
    }
    yield result
  }
}
const safeGenerator = encoding => new SafeGenerator(generator(encoding))

class PushID {
  constructor(encoding) {
    this[encodingSymbol] = toEncoding(encoding)
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
    const alphabet = alphabets[encoding]
    const {length} = alphabet
    const lastIndex = length - 1
    const chars = this[charsSymbol]
    let result = this[encodedTimestampSymbol]
    const timestamp = DateNow()
    if (this[timestampSymbol] !== timestamp) {
      this[timestampSymbol] = timestamp
      const encodedTimestamp = _encodeTimestamp(timestamp, alphabet)
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
        const index = chars[i]
        result += alphabet[index]
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

ObjectDefineProperties(PushID, {
  UID_LENGTH: {
    value: UID_LENGTH
  },
  UID_TIMESTAMP_LENGTH: {
    value: UID_TIMESTAMP_LENGTH
  },
  ENCODING: {
    value: ENCODING
  },
  isPushID: {
    value: isPushID
  },
  getEncodings: {
    value: getEncodings
  },
  isEncoding: {
    value: isEncoding
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

module.exports = PushID
