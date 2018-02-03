'use strict';

const {propOr} = require('ramda');

const routeV = require('../index');

describe('Middleware version control', () => {
  const getUrl = version => `segment/${version}/anotherVersion`;
  let v, versionChecker;

  beforeEach(() => {
    ({v, versionChecker} = routeV());
  });

  describe('#constructor', () => {
    it('should throw an exception if versionPath is not an array', () => {
      expect(() => routeV({versionPath: 1})).toThrow();
    });
    it('should expect empty params', () => {
      expect(() => routeV()).not.toThrow();
    });
  });
  describe('#register', () => {
    let versions;
    beforeEach(() => {
      versions = {'0.0.1': jest.fn(), '>0.0.1': jest.fn(), '*': jest.fn()};
    });
    it('should call the correct version', () => {
      v(versions)({url: getUrl('v0.2.1')});
      expect(versions['>0.0.1'].mock.instances.length).toBe(1);
    });
    it('should call the wild card version if nothing else matched (order is preserved)', () => {
      v(versions)({url: getUrl('v0.0.0')});
      expect(versions['*'].mock.instances.length).toBe(1);
    });
    it('should call the wild card version if bad version was supplied', () => {
      ({v} = routeV({versionExtractor: url => {
        const regexResult = /v(\d+.\d+.\d+)/.exec(url);
        return propOr('0.0.0', 1, regexResult);
      }}));
      v(versions)({url: getUrl('v__')});
      expect(versions['*'].mock.instances.length).toBe(1);
    });
    it('should throw an error if nothing was matched', () => {
      expect(() => v({'0.0.0': jest.fn()})({url: getUrl('v0.0.1')})).toThrow();
    });
    it('should use the custom path provided to get the version', () => {
      const newV = routeV({versionPath: [0, 'custom']});
      newV.register(versions)({custom: getUrl('v0.0.1')});
      expect(versions['0.0.1'].mock.instances.length).toBe(1);
    });
    it('should use the new extractor', () => {
      const newV = routeV({versionExtractor: () => '20.0.0'});
      newV.register(versions)({url: getUrl('_')});
      expect(versions['>0.0.1'].mock.instances.length).toBe(1);
    });
  });
  describe('#versionChecker', () => {
    it('it should pass if version satisfied the predicate ^1.0.0', (done) => {
      const customVChecker = versionChecker((isSatisfied, details) => (ctx, next) => {
        expect(details).toBeTruthy();
        done(!isSatisfied);
      });
      customVChecker('^1.0.0')({url: getUrl('v1.0.1')});
    });
  });
});
