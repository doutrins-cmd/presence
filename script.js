// Configuração inicial
const params = new URLSearchParams(window.location.search);
const userIdFromUrl = params.get('id');
const DISCORD_USER_ID = userIdFromUrl || '1006760238671745137';
const API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

// Elementos do DOM (usuário)
const discordAvatar = document.querySelector('.discord-avatar');
const statusIndicator = document.querySelector('.status-indicator');
const usernameElement = document.querySelector('.username');
const statusElement = document.querySelector('.status');
const nitroEmblem = document.querySelector('.emblem.nitro');
const hypesquadEmblem = document.querySelector('.emblem.hypesquad');

// Elementos do DOM para os cards de presença
const presenceGameCard = document.getElementById('presence-game');
const presenceMusicCard = document.getElementById('presence-music');

// Elementos específicos dos cards
const gameElapsedContainer = presenceGameCard.querySelector('.activity-elapsed-container');
const gameTimeElapsed = presenceGameCard.querySelector('.activity-elapsed');
const musicProgressContainer = presenceMusicCard.querySelector('.music-progress-container');
const musicProgressFill = presenceMusicCard.querySelector('.music-progress-fill');
const musicTimeCurrent = presenceMusicCard.querySelector('.time-current');
const musicTimeTotal = presenceMusicCard.querySelector('.time-total');

let gameStartTime = null;
let musicData = null;

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimers() {
    if (gameStartTime) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const pad = num => num.toString().padStart(2, '0');
        gameTimeElapsed.textContent = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    }
    
    if (musicData) {
        const { start, end } = musicData;
        const now = Date.now();
        const elapsed = now - start;
        const total = end - start;
        
        if (now >= end) {
            musicProgressFill.style.width = '100%';
            musicTimeCurrent.textContent = formatTime(total);
            return;
        }
        const progressPercentage = (elapsed / total) * 100;
        musicProgressFill.style.width = `${progressPercentage}%`;
        musicTimeCurrent.textContent = formatTime(elapsed);
    }
}

async function updateViewCount() {
    const viewCountElement = document.getElementById('view-count-text');
    try {
        const response = await fetch('/api/views');
        if (!response.ok) return;
        const data = await response.json();
        if (data.count) {
            viewCountElement.textContent = data.count.toLocaleString('pt-BR');
        }
    } catch (error) {
        console.error('Erro ao buscar visualizações:', error);
    }
}

function updateDiscordStatus() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const d = data.data;
                discordAvatar.src = d.discord_user.avatar ? `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png?size=128` : 'imagens/placeholder-avatar.png';
                statusIndicator.className = `status-indicator ${d.discord_status}`;
                usernameElement.textContent = `@${d.discord_user.username}`;
                statusElement.textContent = d.discord_status.charAt(0).toUpperCase() + d.discord_status.slice(1);
                const flags = d.discord_user.public_flags;
                hypesquadEmblem.style.display = (flags & 128 || flags & 64 || flags & 256) ? 'inline-block' : 'none';
                nitroEmblem.style.display = d.premium_since ? 'inline-block' : 'none';

                const gameActivity = d.activities.find(a => a.type === 0);
                const musicActivity = d.activities.find(a => a.type === 2);

                presenceGameCard.style.display = 'none';
                presenceMusicCard.style.display = 'none';
                gameStartTime = null;
                musicData = null;
                
                if (gameActivity) {
                    updateActivityCard(presenceGameCard, gameActivity);
                    if (gameActivity.timestamps && gameActivity.timestamps.start) {
                        gameElapsedContainer.style.display = 'flex';
                        gameStartTime = gameActivity.timestamps.start;
                    } else {
                        gameElapsedContainer.style.display = 'none';
                    }
                }
                
                if (musicActivity) {
                    updateActivityCard(presenceMusicCard, musicActivity);
                    if (musicActivity.timestamps && musicActivity.timestamps.start && musicActivity.timestamps.end) {
                        musicProgressContainer.style.display = 'block';
                        musicData = musicActivity.timestamps;
                        musicTimeTotal.textContent = formatTime(musicData.end - musicData.start);
                    } else {
                        musicProgressContainer.style.display = 'none';
                    }
                }
            }
        }).catch(error => {
            console.error("Erro ao buscar dados do Discord:", error);
        });
}

function updateActivityCard(cardElement, activity) {
    cardElement.style.display = 'flex';
    const icon = cardElement.querySelector('.activity-icon');
    const iconSmall = cardElement.querySelector('.activity-icon-small');
    const name = cardElement.querySelector('.activity-name');
    const details1 = cardElement.querySelector('.activity-details-line1');
    const details2 = cardElement.querySelector('.activity-details-line2');

    name.textContent = activity.name || '';
    details1.textContent = activity.details || '';
    details2.textContent = activity.state || '';
    
    if (activity.assets) {
        if (activity.assets.large_image) {
            let largeImgUrl = '';
            const largeImg = activity.assets.large_image;
            if (largeImg.startsWith('mp:')) largeImgUrl = `https://media.discordapp.net/${largeImg.substring(3)}`;
            else if (largeImg.startsWith('spotify:')) largeImgUrl = `https://i.scdn.co/image/${largeImg.substring(8)}`;
            else largeImgUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImg}.png?size=64`;
            icon.src = largeImgUrl;
        }
        if (activity.assets.small_image) {
            iconSmall.style.display = 'block';
            let smallImgUrl = '';
            const smallImg = activity.assets.small_image;
            if (smallImg.startsWith('mp:')) smallImgUrl = `https://media.discordapp.net/${smallImg.substring(3)}`;
            else smallImgUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${smallImg}.png?size=32`;
            iconSmall.src = smallImgUrl;
        } else {
            iconSmall.style.display = 'none';
        }
    }
}

// Inicia as buscas e os timers
updateViewCount();
updateDiscordStatus();
setInterval(updateDiscordStatus, 10000);
setInterval(updateTimers, 1000);