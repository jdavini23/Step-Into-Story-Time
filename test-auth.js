// Quick test to debug the authentication domain issue
const domains = process.env.REPLIT_DOMAINS || "stepintostorytime.com,https://916cd49b-e05e-4186-87b6-021f3aa198a9-00-1kucou5v68gu1.worf.replit.dev/";
const currentHostname = "916cd49b-e05e-4186-87b6-021f3aa198a9-00-1kucou5v68gu1.worf.replit.dev";

console.log("Raw REPLIT_DOMAINS:", domains);
console.log("Current hostname:", currentHostname);

const registeredStrategies = [];
for (const domainEntry of domains.split(",")) {
  const domain = domainEntry.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const strategyName = `replitauth:${domain}`;
  registeredStrategies.push(strategyName);
  console.log(`Domain: '${domainEntry}' -> Cleaned: '${domain}' -> Strategy: '${strategyName}'`);
}

const targetStrategy = `replitauth:${currentHostname}`;
console.log("\nTarget strategy:", targetStrategy);
console.log("Registered strategies:", registeredStrategies);
console.log("Strategy exists:", registeredStrategies.includes(targetStrategy));

// Find exact character differences
const cleanedCurrentDomain = "916cd49b-e05e-4186-87b6-021f3aa198a9-00-1kucou5v68gu1.worf.replit.dev";
const registeredDomain = registeredStrategies[1]?.replace('replitauth:', '');
console.log("\nCharacter comparison:");
console.log("Current domain length:", cleanedCurrentDomain.length);
console.log("Registered domain length:", registeredDomain?.length);
console.log("Current domain:", JSON.stringify(cleanedCurrentDomain));
console.log("Registered domain:", JSON.stringify(registeredDomain));
console.log("Exact match:", cleanedCurrentDomain === registeredDomain);