import { toDynamo, toDynamoMap } from './to-dynamo'

describe('testsuite of utils/to-dynamo', () => {

  it('test toDynamo null', () => {
    expect(toDynamo(void 0)).toEqual({ NULL: true })
    expect(toDynamo(null)).toEqual({ NULL: true })
    expect(toDynamo('')).toEqual({ NULL: true })
  })

  it('test toDynamo string', () => {
    expect(toDynamo('')).toEqual({ NULL: true })
    expect(toDynamo('string!')).toEqual({ S: 'string!' })
  })

  it('test toDynamo number', () => {
    expect(toDynamo(1010)).toEqual({ N: '1010' })
    expect(toDynamo(3.14)).toEqual({ N: '3.14' })
  })

  it('test toDynamo boolean', () => {
    expect(toDynamo(true)).toEqual({ BOOL: true })
    expect(toDynamo(false)).toEqual({ BOOL: false })
  })

  it('test toDynamo buffer', () => {
    expect(toDynamo(Buffer.from('buffer'))).toEqual({ B: Buffer.from('buffer') })
  })

  it('test toDynamo array', () => {
    expect(toDynamo([null, 1, 'string', true, false, Buffer.from('buffer')])).toEqual({ L: [
      { NULL: true },
      { N: '1' },
      { S: 'string' },
      { BOOL: true },
      { BOOL: false },
      { B: Buffer.from('buffer') },
    ] })
  })

  it('test toDynamo object', () => {
    expect(toDynamo({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })).toEqual({ M: {
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    } })
  })

  it('test toDynamoMap', () => {
    expect(toDynamoMap({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })).toEqual({
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    })
  })
})
