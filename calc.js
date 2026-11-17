// Matemática pura: distribución normal estándar y prueba Z para la media.

// Erf de Abramowitz-Stegun 7.1.26, error máximo ~1.5e-7.
function erf(x) {
  const signo = Math.sign(x);
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poli = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return signo * (1 - poli * Math.exp(-ax * ax));
}

function normCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Cuantil normal (Acklam). Válido para 0 < p < 1.
function invNorm(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const limite = 0.02425;

  if (p < limite) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - limite) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
         (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// H0 siempre es μ = μ₀; `cola` indica la alternativa.
function contrastar({ mu0, sigma, n, xbar, alfa, cola }) {
  const z = (xbar - mu0) / (sigma / Math.sqrt(n));
  const phi = normCdf(z);
  const p = Math.min(1, Math.max(0,
    cola === 'bilateral' ? 2 * (1 - normCdf(Math.abs(z)))
      : cola === 'derecha' ? 1 - phi
      : phi));

  const critico = invNorm(1 - (cola === 'bilateral' ? alfa / 2 : alfa));
  const rechaza = cola === 'bilateral' ? Math.abs(z) > critico
    : cola === 'derecha' ? z > critico
    : z < -critico;

  return { z, p, critico, rechaza };
}

// Autocomprobación: valores de referencia conocidos.
console.assert(Math.abs(normCdf(0) - 0.5) < 1e-6, 'Φ(0) debería ser 0,5');
console.assert(Math.abs(normCdf(1.959964) - 0.975) < 1e-5, 'Φ(1,96) debería ser 0,975');
console.assert(Math.abs(invNorm(0.975) - 1.959964) < 1e-5, 'Φ⁻¹(0,975) debería ser 1,96');
console.assert(Math.abs(invNorm(0.95) - 1.644854) < 1e-5, 'Φ⁻¹(0,95) debería ser 1,645');
(function () {
  const r = contrastar({ mu0: 50, sigma: 10, n: 25, xbar: 53.2, alfa: 0.05, cola: 'bilateral' });
  console.assert(Math.abs(r.z - 1.6) < 1e-9, 'Z del caso de prueba debería ser 1,6');
  console.assert(Math.abs(r.p - 0.1095986) < 1e-5, 'p del caso de prueba debería ser 0,1096');
  console.assert(r.rechaza === false, 'el caso de prueba no debería rechazar H₀');
})();
