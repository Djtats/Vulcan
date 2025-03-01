import { createDummyCollection, isoCreateCollection } from 'meteor/vulcan:test'
import { createCollection } from 'meteor/vulcan:lib';
import Users from 'meteor/vulcan:users'
import expect from 'expect';
import { getDefaultResolvers } from '../../lib/modules/default_resolvers';
import sinon from 'sinon'

describe('vulcan:core/default_resolvers', function () {
  const resolversOptions = {
    typeName: 'Dummy',
    collectionName: 'Dummies',
    options: {}
  };
  // TODO: build helpers to mock collections
  const buildContext = ({
    usersMocks = {},
    currentUser = adminUser,
    ...otherProps
  }) => ({
    Users,
    currentUser,
    ...otherProps
  });
  // TODO: what's the name of this argument? handles cache
  const lastArg = { cacheControl: {} };
  // eslint-disable-next-line no-unused-vars
  const loggedInUser = { _id: 'foobar', groups: [], isAdmin: false };
  // eslint-disable-next-line no-unused-vars
  const adminUser = { _id: 'foobar', groups: [], isAdmin: true };
  const getSingleResolver = () => getDefaultResolvers(resolversOptions).single.resolver;
  const getMultiResolver = () => getDefaultResolvers(resolversOptions).multi.resolver;

  describe('single', function () {
    it('defines the correct fields', function () {
      const { single } = getDefaultResolvers(resolversOptions);
      const { description, resolver } = single;
      expect(description).toBeDefined();
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(Function);
    });

    // TODO: the current behaviour is not consistent, could be improved
    // @see https://github.com/VulcanJS/Vulcan/issues/2118
    it.skip('return null if documentId is undefined in selector', function () {
      const resolver = getSingleResolver();
      // no documentId
      const input = { selector: {} };
      // non empty db
      const context = buildContext({
        Dummies: createDummyCollection({
          results: { load: { _id: 'my-document' } }
        })
      });
      const res = resolver(null, { input }, context, lastArg);
      return expect(res).resolves.toEqual({ result: null });
    });
    it('return document in case of success', function () {
      const resolver = getSingleResolver();
      const documentId = 'my-document';
      const document = { _id: documentId };
      const input = { selector: { documentId } };
      // non empty db
      const context = buildContext({
        Dummies: createDummyCollection({
          results: { load: document }
        })
      });
      const res = resolver(null, { input }, context, lastArg);
      return expect(res).resolves.toEqual({ result: document });
    });
    it('return null if failure to find doc but allowNull is true', function () {
      const resolver = getSingleResolver();
      const documentId = 'bad-document';
      const input = { selector: { documentId }, allowNull: true };
      // empty db
      const context = buildContext({
        Dummies: createDummyCollection({})
      });
      const res = resolver(null, { input }, context, lastArg);
      return expect(res).resolves.toEqual({ result: null });
    });
    it('throws if documentId is defined but does not match any document', function () {
      const resolver = getSingleResolver();
      const documentId = 'bad-document';
      const input = { selector: { documentId } };
      // empty db
      const context = buildContext({
        Dummies: createDummyCollection({})
      });
      return expect(resolver(null, { input }, context, lastArg)).rejects.toThrow();
    });
  });

  describe('multi', () => {
    it('defines the correct fields', function () {
      const { multi } = getDefaultResolvers(resolversOptions);
      const { description, resolver } = multi;
      expect(description).toBeDefined();
      expect(resolver).toBeDefined();
      expect(resolver).toBeInstanceOf(Function);
    });
    it('get documents', () => {
      const resolver = getMultiResolver();
      const dbDocuments = [{
        _id: '1'
      }, {
        _id: '2'
      }]
      const input = { terms: {} };
      // non empty db
      const context = buildContext({
        Dummies: createDummyCollection({
          results: { find: dbDocuments }
        })
      });
      const res = resolver(null, { input }, context, lastArg);
      return expect(res).resolves.toMatchObject({ results: dbDocuments });

    })
    describe('security', () => {
      it('filter out unallowed documents', () => {
        const resolver = getMultiResolver();
        const doc2 = { _id: '2' }
        const dbDocuments = [{
          _id: '1'
        }, doc2]
        const input = { terms: {} };
        const context = buildContext({
          // non empty db
          Dummies: createDummyCollection({
            results: {
              find: dbDocuments,
            },
            // filter out doc 1
            checkAccess: (currentUser, { _id }) => _id !== '1'
          }),
        });
        const res = resolver(null, { input }, context, lastArg);
        return expect(res).resolves.toMatchObject({ results: [doc2] });
      })
      it('filter out restricted fields from retrieved documents', () => {
        const resolver = getMultiResolver();
        // foo does not exist in the schema
        const doc1 = { _id: '1', foo: 'bar' }
        const doc2 = { _id: '2', foo: 'bar' }
        const dbDocuments = [doc1, doc2]
        const input = { terms: {} };
        const context = buildContext({
          // non empty db
          Dummies: createDummyCollection({
            results: {
              find: dbDocuments,
            }
          })
        });
        const res = resolver(null, { input }, context, lastArg);
        return expect(res).resolves.toMatchObject({
          results: [
            { _id: '1' }, { _id: '2' }
          ]
        });
      })

    })
    // @see https://5da5072ecae7f900081d6d9a--happy-villani-6ca506.netlify.com/
    describe('user defined search', () => {
      // TODO: this is a unit test based on props but an integration test
      // with mongo would be more efficient
      it('filter documents based on user input', async () => {
        const resolver = getMultiResolver();
        const input = {
          where: { year: { gte: 2000 } }
        }
        const findSpy = sinon.spy(
          () => ({ fetch: () => [] })
        )
        const context = buildContext({
          Dummies: createDummyCollection({
            schema: {
              _id: { type: String, canRead: ['admins'] },
              year: { type: Number, canRead: ['admins'] }
            },
            find: findSpy,
          })
        })
        const res = await resolver(null, { input }, context, lastArg)
        // TODO: 
        expect(findSpy.getCall(0).args[2]).toMatchObject({
          year: { $gte: 2000 }
        })
      })
      // important to avoid indirect access to the value (filtering is indirectly equivalent to reading)
      it('do not filter based on non viewable field', async () => {
        const resolver = getMultiResolver();
        const input = {
          where: { year: { gte: 2000 } }
        }
        const findSpy = sinon.spy(
          () => ({ fetch: () => [] })
        )
        const context = buildContext({
          Dummies: createDummyCollection({
            schema: {
              _id: { type: String, canRead: ['admins', 'members'] },
              year: { type: Number, canRead: ['admins'] }
            },
            currentUser: loggedInUser, // not an admin so can't filter on year,
            find: findSpy,
          })
        })
        const res = await resolver(null, { input }, context, lastArg)
        expect(findSpy.getCall(0).args[2].year).toBeUndefined()
      })
      // seems to work eventually...
      /*
      it('runs integration test', async () => {
        const Foobars = createCollection({
          collectionName: 'Foobars',
          typeName: 'Foobar',
          schema: { _id: { type: String, canRead: ['admins'] } }
        })
        await Foobars.insert({ _id: '1' })
        const res = await Foobars.find().fetch()
        console.log(res)
        await Foobars.rawCollection().drop()
      })
      */

    })
  })
});
