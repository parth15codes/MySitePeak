(function() {
  const bolts = document.getElementById("vault-bolts");
  const rBolt = 136;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * 2 * Math.PI;
    const cx = 150 + rBolt * Math.cos(angle);
    const cy = 150 + rBolt * Math.sin(angle);
    bolts.innerHTML += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="#0f1013" stroke="#5b6472" stroke-width="1"/>`;
  }
  const spokes = document.getElementById("vault-spokes");
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * 2 * Math.PI;
    const x2 = 150 + 58 * Math.cos(angle);
    const y2 = 150 + 58 * Math.sin(angle);
    spokes.innerHTML += `<line x1="150" y1="150" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
})();
