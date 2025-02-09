# LocustFinder Frontend

The goal of this webmap is to visualize predictions of locust breeding zones on the map. This should happen in 3 steps:

1. Draw the AOI or select their country.
2. Pick a start/end date.
3. Predict.

### Stack

Refer to the [package.json](./package.json) for full list of dependencies.

### Setting up

1. Clone the repo:

```js
git clone https://github.com/kshitijrajsharma/geoaihack2025.git
cd frontend 
```

2. Install the dependencies:

```js
pnpm install
```
3. Start the server:

```js
pnpm dev
```
4. Build/Deploy:

```js
pnpm build
```

### Future work

Aparently this is not production ready due to the time-constraint environment it was developed. For future work, these will be required:

- Visualize the prediction results COG on the map. _@geomatico/maplibre-cog-protocol_ is a library that was intended to render the COG. The plan will be to visualize the COGs from the backend and add a hover effect for each pixels to present the breeding zone probability to the users as a tooltip.

- Other production environment best practices!