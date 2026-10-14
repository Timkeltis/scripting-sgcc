// Offline only: no live HTTP, login, or SMS. Run: node lib/direct-core.test.mjs
import fs from 'node:fs';

const assert={
 equal(a,b){if(a!==b)throw Error(`Expected ${b}, got ${a}`);},
 notEqual(a,b){if(a===b)throw Error('Expected different values');},
 ok(v){if(!v)throw Error('Assertion failed');},
 throws(fn,re){try{fn();}catch(e){if(re&&!re.test(e.message))throw e;return;}throw Error('Expected rejection');},
 async rejects(p,test){try{await p;}catch(e){if(test && !(typeof test==='function'?test(e):test.test(e.message)))throw e;return;}throw Error('Expected async rejection');}
};
// Deterministic TEST-ONLY bytes. Production must inject a CSPRNG.
let seed=123456;
function randomBytes(n){return Uint8Array.from({length:n},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>24;});}
const source=fs.readFileSync('/var/mobile/Library/Mobile Documents/iCloud~com~thomfang~Scripting/Documents/scripts/SGCC/lib/direct-core.js','utf8');
// Only remove ESM export keywords for the embedded CommonJS-only test runner.
const mod=new Function(source.replace(/\bexport /g,'')+'\nreturn {createDirectCore,SgApp,runSgcc,requestDeviceSms,verifyDeviceSms};')();
const records=new Map();
const ctx={randomBytes:n=>new Uint8Array(randomBytes(n)),storage:{getJSON:k=>records.get(k),setJSON:(k,v)=>records.set(k,JSON.parse(JSON.stringify(v)))},http:{post(){throw Error('NETWORK FORBIDDEN');}}};
const c=mod.createDirectCore(ctx).crypto;
const hex=c.toHex, unhex=c.fromHex;
assert.equal(c.sm3hex('abc'),'66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
assert.equal(c.sm3hex('abcd'.repeat(16)),'debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
assert.equal(c.md5hex('abc'),'900150983cd24fb0d6963f7d28e17f72');
assert.equal(hex(c.sha256('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
assert.equal(hex(c.hmacSha256(new Uint8Array(20).fill(11),'Hi There')),'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
const key=unhex('0123456789abcdeffedcba9876543210');
assert.equal(hex(c.sm4Block(c.sm4Key(key),key,true)),'681edf34d206965e86b3e94f536e4246');
assert.equal(hex(c.sm4DecryptEcb(c.sm4EncryptEcb(key,key),key)),hex(key));
for(const bad of [new Uint8Array(0),new Uint8Array(15)])assert.throws(()=>c.sm4DecryptEcb(bad,key));
for(const pad of [0,17,2]){const plain=new Uint8Array(16);plain[15]=pad;assert.throws(()=>c.sm4DecryptEcb(c.sm4Block(c.sm4Key(key),plain,true),key),/padding/);}
assert.throws(()=>c.sm4Key(new Uint8Array(15)));
const ae=c.aesExpand(unhex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'));
assert.equal(hex(c.aesEncryptBlock(unhex('00112233445566778899aabbccddeeff'),ae.w,ae.Nr)),'8ea2b7ca516745bfeafc49904b496089');
const priv='1'.padStart(64,'0');
assert.equal(c.sm2DerivePub(priv),'32c4ae2c1f1981195f9904466a39c9948fe30bbff2660be1715a4589334c74c7bc3736a2f4f6779c59bdcee36b692153d0a9877cc62a474002df32e52139f0a0');
const cipher=c.sm2EncryptKey('offline test',c.sm2DerivePub(priv));
assert.equal(c.utf8dec(c.sm2DecryptKey(cipher,priv)),'offline test');
for(const index of [130,194]){const tampered=cipher.slice(0,index)+(cipher[index]==='0'?'1':'0')+cipher.slice(index+1);assert.throws(()=>c.sm2DecryptKey(tampered,priv),/C3/);}
assert.throws(()=>c.sm2DerivePub('0'.repeat(64)),/scalar/);
assert.throws(()=>c.sm2DerivePub(c.SM2_N.toString(16)),/scalar/);
assert.throws(()=>c.sm2EncryptKey('x','0'.repeat(128)),/point/);
let draws=0;
const rejection=mod.createDirectCore({randomBytes:()=>{draws++;return unhex(draws===1?c.SM2_N.toString(16):priv);}}).crypto;
assert.equal(rejection.randomScalar(),1n);assert.equal(draws,2);
assert.throws(()=>mod.createDirectCore({randomBytes:()=>new Uint8Array(1)}).crypto.randomBytes(32));
assert.ok(!source.includes('Math.random'));
const a=new mod.SgApp(ctx,'alice','secret'),b=new mod.SgApp(ctx,'bob','secret');
assert.notEqual(a.device().guid,b.device().guid);
assert.equal(new mod.SgApp(ctx,'alice','secret').device().guid,a.device().guid);
a.login=async()=>{throw Object.assign(Error('device'),{code:'4006'});};
a.sendDeviceSms=async()=>{throw Error('AUTOMATIC SMS FORBIDDEN');};
await assert.rejects(a.ensure(),e=>e.code==='4006');
const app=new mod.SgApp(ctx,'sms-user','secret');let calls=0;
app.post=async(path)=>{calls++;assert.ok(path.endsWith('/c1/f01'));return {code:'1',data:{bizrt:{codeKey:'offline-code-key'}}};};
await assert.rejects(app.verifyDeviceSms('123456'),/先显式/);
assert.equal(await mod.requestDeviceSms(app),'offline-code-key');assert.equal(calls,1);
app.login=async(code,ck)=>{assert.equal(code,'123456');assert.equal(ck,'offline-code-key');return {token:'mock'};};
await mod.verifyDeviceSms(app,'123456');
await assert.rejects(app.verifyDeviceSms('123456'),/先显式/);
const sess={user:'reuse',token:'offline',exp:Date.now()+3600000,accounts:[]};
const reuse=new mod.SgApp(ctx,'reuse','secret');records.set(reuse.sk('sgcc_app_sess'),sess);
reuse.login=()=>{throw Error('LOGIN SHOULD NOT HAPPEN');};
assert.equal((await reuse.ensure()).token,'offline');
assert.equal((await new mod.SgApp(ctx,'reuse','secret').ensure()).token,'offline');
const concurrent=new mod.SgApp(ctx,'concurrent','secret');let logins=0;
concurrent.login=async()=>{logins++;await Promise.resolve();return sess;};
await Promise.all([concurrent.ensure(),concurrent.ensure()]);assert.equal(logins,1);
console.log('PASS: SM3/MD5/SHA256/HMAC/SM4/AES vectors; SM2 generator, roundtrip, C3, scalar rejection; malformed crypto; device isolation; explicit SMS; session reuse/singleflight. No network.');
process.exit(0);
