<div align="center">
    <a href="https://giladgd.github.io/semantic-golfer/"><img alt="Semantic Golfer icon" src="https://raw.githubusercontent.com/giladgd/semantic-golfer/master/assets/icon.png" width="200" /></a>
    <h1>Semantic Golfer</h1>
    <p>How little can you write and still get everything right?</p>
    <p></p>
</div>

<div align="center">

[![Build](https://github.com/giladgd/semantic-golfer/actions/workflows/release.yml/badge.svg)](https://github.com/giladgd/semantic-golfer/actions/workflows/release.yml)
[![License](https://badgen.net/badge/license/MIT/green)](https://github.com/giladgd/semantic-golfer/blob/master/LICENSE)
[![Website](https://badgen.net/badge/website/Semantic%20Golfer/blue)](https://giladgd.github.io/semantic-golfer/)
[![npm](https://badgen.net/npm/v/semantic-golfer)](https://www.npmjs.com/package/semantic-golfer)

[![Semantic Golfer's Playground and Semantic Golfing demo](https://raw.githubusercontent.com/giladgd/semantic-golfer/master/assets/demo.video.svg)](https://giladgd.github.io/semantic-golfer/)

</div>

A playground and a game to play around with [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)'s [structured decisions](https://node-llama-cpp.withcat.ai/guide/structured-decisions).
Try writing the shortest text that meets all criteria, and watch the local model score its meaning as you type in real time.

```bash
npx semantic-golfer
```

[Or download the desktop app](https://github.com/giladgd/semantic-golfer/releases/latest)

## Features

- **Semantic Golfing:** write a message that matches every condition within the character limit
- **Category Camouflage:** blend two target meanings while avoiding the other categories
- **Playground:** experiment with `noul`, `choice`, and `score` decisions using your own documents and criteria
- Download a model in the app or open a local GGUF file. Inference runs on your machine
- macOS, Windows, and Linux support

## Learn more

- [Structured decisions guide](https://node-llama-cpp.withcat.ai/guide/structured-decisions)
- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)

## Made with AI

This app was predominantly made with AI. The human did a lot of prompting, reviewing all code, making many manual fixes, and directed everything. It has taken the human a lot of effort and time.
The human cares about disclosing when a project was created using AI because the human knows other people want to know it. The human has manually reviewed everything and made fixes where relevant and is comfortable shipping the project. The human has manually written this text.

## Acknowledgements

Built with [node-llama-cpp](https://github.com/withcatai/node-llama-cpp), [Electron](https://www.electronjs.org/), and [React](https://react.dev/). [Icon credits](https://github.com/giladgd/semantic-golfer/blob/master/src/icons/LICENSES.md).
