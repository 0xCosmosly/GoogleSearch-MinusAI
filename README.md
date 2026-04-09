# Google Search Minus AI 🔍

A lightweight Tampermonkey userscript that automatically appends ` -ai` to your Google search queries. 

Filtering out AI-generated SEO spam has never been easier!

## Features that make it great

- **Automatic Append**: Adds ` -ai` to any search from the Google search bar.
- **Deep-Link Support**: If you navigate directly to a Google Search result, it'll ensure the filter is active and reload if it isn't.
- **Set and Forget**: Once installed, you don't need to do anything. Your search queries are automatically filtered.
- **Completely Private**: Everything happens locally in your browser. No data is sent anywhere, and it only interacts with the visible page elements.

## Getting Started

1. Make sure you have the [Tampermonkey](https://www.tampermonkey.net/) extension installed in your browser.
2. Open the raw version of [`google-search-minus-ai.user.js`](./google-search-minus-ai.user.js) in your browser.
3. Tampermonkey will automatically prompt you to install it. Click **Install**.
4. Start searching on `google.com` and watch the results become relevant again!

## Under the Hood

This script uses standard DOM event listeners to intercept search form submissions. It also monitors the URL's query parameters for direct navigations. 

*Note: This script relies on Google's search URL structure. If they change their query parameter names, it'll need a quick update!*

---
*Created to clean up your search results, one query at a time.*
