importScripts('ExtPay.js');
ExtPay('huepick').startBackground();
chrome.runtime.onInstalled.addListener(() => {});
