export function demoHarnessEnabled() {
  return truthy(process.env.ALLOW_DEMO_HARNESS);
}

export function publicDemoHarnessConfig() {
  return {
    enabled: demoHarnessEnabled()
  };
}

function truthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}
