let tempoAtual = 0;
let cronometro;
let rodando = false;

function formatarTempo(tempo) {
    const horas = Math.floor(tempo / 3600);
    const minutos = Math.floor((tempo % 3600) / 60);
    const segundos = tempo % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function atualizarTempo() {
    document.getElementById("tempo").textContent = formatarTempo(tempoAtual);
    tempoAtual++;
}

export function iniciarTimer() {
    if (!rodando) {
        cronometro = setInterval(atualizarTempo, 1000);
        rodando = true;
    }
};

export function pararTimer() {
    if (rodando) {
        clearInterval(cronometro);
        rodando = false;
    }
};

export function resetTimer() {
    tempoAtual = 0;
    document.getElementById("tempo").textContent = formatarTempo(tempoAtual);
}
