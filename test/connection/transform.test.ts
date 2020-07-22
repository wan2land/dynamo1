import { fromDynamo, fromDynamoMap, toDynamoMap, toDynamo } from '../../src/connection/transformer'

describe('testsuite of connection/transform.fromDynamo', () => {

  it('test fromDynamo null', () => {
    expect(fromDynamo({ NULL: true })).toEqual(null)
  })

  it('test fromDynamo string', () => {
    expect(fromDynamo({ S: 'string!' })).toEqual('string!')
  })

  it('test fromDynamo number', () => {
    expect(fromDynamo({ N: '1010' })).toEqual(1010)
    expect(fromDynamo({ N: '3.14' })).toEqual(3.14)
  })

  it('test fromDynamo boolean', () => {
    expect(fromDynamo({ BOOL: true })).toEqual(true)
    expect(fromDynamo({ BOOL: false })).toEqual(false)
  })

  it('test fromDynamo buffer', () => {
    expect(fromDynamo({ B: Buffer.from('buffer') })).toEqual(Buffer.from('buffer'))
  })

  it('test fromDynamo array', () => {
    expect(fromDynamo({ L: [
      { NULL: true },
      { N: '1' },
      { S: 'string' },
      { BOOL: true },
      { BOOL: false },
      { B: Buffer.from('buffer') },
    ] })).toEqual([null, 1, 'string', true, false, Buffer.from('buffer')])
  })

  it('test fromDynamo object', () => {
    expect(fromDynamo({ M: {
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    } })).toEqual({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })
  })

  it('test fromDynamoMap', () => {
    expect(fromDynamoMap({
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    })).toEqual({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })
  })
})

describe('testsuite of connection/transform.toDynamo', () => {

  it('test toDynamo null', () => {
    expect(toDynamo(void 0)).toEqual({ NULL: true })
    expect(toDynamo(null)).toEqual({ NULL: true })
  })

  it('test toDynamo string', () => {
    expect(toDynamo('')).toEqual({ S: '' })
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
