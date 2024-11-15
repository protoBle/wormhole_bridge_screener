# Wormhole bridge screener

This repository is built to verify whether the locked value on the source chain matches the minted value on the destination chain.
The list of source and destination addresses for each chain is obtained from https://github.com/wormhole-foundation/wormhole-token-list/blob/main/content/by_source.csv

## Steps to use
1. Select the source chain, and the available token symbol will be listed
2. Select the token symbol to audit
3. 2 tables will be shown. The Source table will show the value locked, while the Destination table will show the minted value
4. Bar graph will be shown in the bottom to visualise the total value locked at source and minted value at destination chain

## Deployed url

This repository is deployed at https://wormhole-audit.web.app/

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

