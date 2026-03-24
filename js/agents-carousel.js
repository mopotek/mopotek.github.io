(function () {
  var activeIndex = 0;
  var descPanel; // description panel component instance

  // ---------- Component: description panel ----------
  // Standalone — receives an agent object as a prop, animates content in on
  // each update. The outer element keeps aria-live="polite" (set in HTML) so
  // screen readers announce the new agent name whenever the panel updates.

  function createDescriptionPanel(panelEl) {
    function update(agent) {
      // Replace inner content with a fresh wrapper on every call.
      // A new element means the CSS @keyframes on .agents-desc-content
      // fires automatically without any JS timing tricks.
      var wrapper = document.createElement('div');
      wrapper.className = 'agents-desc-content';
      wrapper.innerHTML =
        '<h3 class="agents-desc-name">' + agent.name + '</h3>' +
        (agent.tech ? (Array.isArray(agent.tech) ? agent.tech.map(function(t) { return '<span class="agents-desc-chip">' + t + '</span>'; }).join('') : '<span class="agents-desc-chip">' + agent.tech + '</span>') : '') +
        '<p class="agents-desc-text">' + agent.description + '</p>';

      panelEl.innerHTML = '';
      panelEl.appendChild(wrapper);
    }

    return { update: update };
  }

  // ---------- Active card management ----------
  // Cards rotate through 4 fixed CSS slot positions (0=front, 1=left, 2=top, 3=right).
  // Changing the active index shifts every card's slot by the same delta,
  // creating the "rotating deck" feel.

  function setActiveCard(newIndex) {
    var total = agentsData.length;
    var cards = document.querySelectorAll('#agentsCarouselArea .playing-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].setAttribute('data-slot', String((i - newIndex + total) % total));
      cards[i].setAttribute('aria-current', i === newIndex ? 'true' : 'false');
      cards[i].classList.remove('is-hovered'); // clear any lingering nudge state
    }
    activeIndex = newIndex;
    descPanel.update(agentsData[newIndex]);
  }

  // ---------- Layout A: playing card HTML builder ----------

  function buildPlayingCardHTML(agent, index) {
    return (
      '<div class="playing-card"' +
      ' role="button"' +
      ' tabindex="0"' +
      ' aria-label="' + agent.name + '"' +
      ' aria-current="' + (index === activeIndex ? 'true' : 'false') + '"' +
      ' data-index="' + index + '"' +
      ' data-suit="' + agent.suit + '"' +
      ' data-slot="' + ((index - activeIndex + agentsData.length) % agentsData.length) + '"' +
      ' style="--card-accent:' + agent.accentColor + ';">' +
        '<div class="card-corner card-corner-tl">' +
          '<span class="card-rank">' + agent.rank + '</span>' +
          '<span class="card-suit-sym">' + agent.suit + '</span>' +
        '</div>' +
        '<div class="card-image-area">' +
          (agent.image
            ? '<img class="card-image" src="' + agent.image + '" alt="' + agent.name + '">'
            : '<div class="card-image-placeholder"></div>') +
        '</div>' +
        '<div class="card-corner card-corner-br">' +
          '<span class="card-rank">' + agent.rank + '</span>' +
          '<span class="card-suit-sym">' + agent.suit + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderLayoutA() {
    return (
      '<div class="card-fan-container">' +
        agentsData.map(function (agent, i) {
          return buildPlayingCardHTML(agent, i);
        }).join('') +
      '</div>'
    );
  }

  // ---------- Render: carousel area ----------

  function renderCarousel() {
    var area = document.getElementById('agentsCarouselArea');
    if (!area) return;

    area.innerHTML =
      renderLayoutA() +
      '<div class="agents-arrow-buttons">' +
        '<button class="agent-arrow-btn" id="agentPrev" aria-label="Previous agent">&#8592;</button>' +
        '<button class="agent-arrow-btn" id="agentNext" aria-label="Next agent">&#8594;</button>' +
      '</div>';

    document.getElementById('agentPrev').addEventListener('click', function () {
      setActiveCard((activeIndex + 1) % agentsData.length);
    });

    document.getElementById('agentNext').addEventListener('click', function () {
      setActiveCard((activeIndex - 1 + agentsData.length) % agentsData.length);
    });

    // Hover: nudge non-active cards to signal they're clickable.
    // Click: activate the card (bring it to the front).
    var cards = area.querySelectorAll('.playing-card');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('mouseenter', function () {
          if (card.getAttribute('data-slot') !== '0') {
            card.classList.add('is-hovered');
          }
        });
        card.addEventListener('mouseleave', function () {
          card.classList.remove('is-hovered');
        });
        card.addEventListener('click', function () {
          setActiveCard(parseInt(card.getAttribute('data-index'), 10));
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveCard(parseInt(card.getAttribute('data-index'), 10));
          }
        });
      })(cards[i]);
    }

    // Touch swipe on the card container: swipe left = next, swipe right = prev.
    var container = area.querySelector('.card-fan-container');
    var touchStartX = 0;
    container.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    container.addEventListener('touchend', function (e) {
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 50) {
        if (delta < 0) {
          setActiveCard((activeIndex - 1 + agentsData.length) % agentsData.length);
        } else {
          setActiveCard((activeIndex + 1) % agentsData.length);
        }
      }
    }, { passive: true });
  }

  // ---------- Init ----------

  function init() {
    descPanel = createDescriptionPanel(document.getElementById('agentsDescriptionPanel'));
    renderCarousel();
    descPanel.update(agentsData[activeIndex]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
