Doc to help updating downstream applications. Breaking changes and packages updates are listed here.

Please open an issue or a pull request if you feel this doc is incomplete.

## From 1.13.3 to 1.14.0

- Update React-Router to v5+. Versions must match exactly between react-router and react-router-dom `npm i --save-exact react-router@5.0.1 react-router-dom@5.0.1`. Note: v4 to v5 is supposed to be a minor update so there are not many breaking changes.
- Optionally update react-router-bootstrap to v0.25.0 `npm i --save-exact react-router-bootstrap@0.25.0`

## From 1.13.2 to 1.13.3

- Update React to a version over 16.8 (and under 17 which will bring breaking changes) to access hooks
- Update React Apollo and Apollo Client to access GraphQL hooks: `npm i --save-exact apollo-client@2.6.3; npm i --save react-apollo@3.0.0`
- `compose` is not exported by `react-apollo`, use `recompose` instead.
- More broadly see [`react-apollo` changelog](https://github.com/apollographql/react-apollo/blob/master/Changelog.md) for breaking changes
- `editMutation`, `newMutation` etc. are deprecated, use the new `updateFoo`, `createFoo` syntax. An error message is thrown where deprecated mutations are used to help debugging
- When using Vulcan data oriented hooks (`useMulti`, `useCreate`...), use the new `queryOptions` and `mutationOptions` option to pass options to the underlying `useQuery` and `useMutation` hooks.
Example call: `useMulti({collection: Foos, queryOptions: { errorPolicy: "all" } })`.
- No need to call `registerComponent` anymore to use Vulcan HOC. You can call them directly even if the underlying fragment is not yet registered.
- Watched Mutations has been removed because it didn't work anymore, in favour to better Apollo's `update` option for mutations.

