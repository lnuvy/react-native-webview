import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import WebView from 'react-native-webview';

// Reproduction only. ReproExternalUserScriptProbe.m sets window.__externalSdkScript on every page.
// This screen loads a page twice, changes injectedJavaScript, then loads a third page.
const report = (label: string) => `
  window.ReactNativeWebView.postMessage(JSON.stringify({
    label: '${label}',
    page: document.body.innerText,
    external: window.__externalSdkScript === true
  }));
  true;
`;

const page = (n: number) => `<html><body><p>load ${n}</p></body></html>`;

export default function ExternalScripts() {
  const [load, setLoad] = useState(1);
  const [injected, setInjected] = useState(report('before prop change'));
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setLoad(2), 2500),
      setTimeout(() => setInjected(report('after prop change')), 4500),
      setTimeout(() => setLoad(3), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        testID="external-scripts-result"
        style={{ padding: 8 }}
      >
        {lines.map((line) => (
          <Text
            key={line}
            style={{ fontSize: 16 }}
          >
            {line}
          </Text>
        ))}
      </View>
      <WebView
        style={{ height: 120 }}
        source={{ html: page(load), baseUrl: 'https://example.com/' }}
        injectedJavaScript={injected}
        onMessage={(event: { nativeEvent: { data?: string } }) => {
          const data = JSON.parse(event.nativeEvent.data ?? '{}');
          const line = `${data.page} | ${data.label} | external=${data.external}`;
          console.log('[external-scripts]', line);
          setLines((previous) => [...previous, line]);
        }}
      />
    </View>
  );
}
