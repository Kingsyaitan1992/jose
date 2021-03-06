import test from 'ava';

const root = !('WEBCRYPTO' in process.env) ? '#dist' : '#dist/webcrypto';
Promise.all([
  import(`${root}/lib/encrypt_key_management`),
  import(`${root}/util/generate_key_pair`),
]).then(
  ([{ default: encryptKeyManagement }, { default: generateKeyPair }]) => {
    test('lib/encrypt_key_management.ts', async (t) => {
      await t.throwsAsync(encryptKeyManagement('foo'), {
        code: 'ERR_JOSE_NOT_SUPPORTED',
        message: 'unsupported or invalid "alg" (JWE Algorithm) header value',
      });
    });

    function conditional({ webcrypto = 1, electron = 1 } = {}, ...args) {
      let run = test;
      if (!webcrypto && 'WEBCRYPTO' in process.env) {
        run = run.failing;
      }

      if (!electron && 'electron' in process.versions) {
        run = run.failing;
      }
      return run;
    }

    conditional({ webcrypto: 0, electron: 0 })(
      'ECDH-ES cannot be executed with secp256k1',
      async (t) => {
        const { publicKey } = await generateKeyPair('ES256K');
        await t.throwsAsync(encryptKeyManagement('ECDH-ES', 'A128GCM', publicKey), {
          code: 'ERR_JOSE_NOT_SUPPORTED',
          message:
            'ECDH-ES with the provided key is not allowed or not supported by your javascript runtime',
        });
      },
    );
  },
  (err) => {
    test('failed to import', (t) => {
      console.error(err);
      t.fail();
    });
  },
);
