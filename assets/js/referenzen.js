// The regular image links remain usable without this optional gallery enhancement.
(() => {
  const dialog = document.querySelector('#referencePreview');
  const largeImage = dialog.querySelector('.preview-image');
  const title = dialog.querySelector('.preview-title');
  const caption = dialog.querySelector('.preview-caption');
  const closeButton = dialog.querySelector('.preview-close');
  const largePrev = dialog.querySelector('[data-preview-prev]');
  const largeNext = dialog.querySelector('[data-preview-next]');
  let activeGallery = null;
  let scrollLock = null;

  const restorePage = () => {
    if (!scrollLock) return;
    const saved = scrollLock;
    scrollLock = null;
    for (const [property, old] of Object.entries(saved.styles)) {
      if (old.value) document.body.style.setProperty(property, old.value, old.priority);
      else document.body.style.removeProperty(property);
    }
    window.scrollTo({left:saved.x, top:saved.y, behavior:'instant'});
    const focusTarget = saved.opener?.isConnected && saved.opener.getClientRects().length
      ? saved.opener : activeGallery?.slides[activeGallery.index].querySelector('a');
    focusTarget?.focus({preventScroll:true});
  };
  const closePreview = () => {
    if (dialog.open) dialog.close();
    restorePage();
  };
  const updatePreview = () => {
    const slide = activeGallery.slides[activeGallery.index];
    const image = slide.querySelector('img');
    largeImage.src = slide.querySelector('a').href;
    largeImage.alt = image.alt;
    title.textContent = activeGallery.title;
    caption.textContent = `${activeGallery.index + 1} / ${activeGallery.slides.length} · ${slide.querySelector('figcaption').textContent.trim()}`;
    largePrev.hidden = largeNext.hidden = activeGallery.slides.length < 2;
  };
  const openPreview = (gallery,opener) => {
    if (dialog.open) return;
    activeGallery = gallery;
    updatePreview();
    const properties = ['position', 'top', 'left', 'width'];
    const width = document.body.getBoundingClientRect().width;
    scrollLock = {x:window.scrollX,y:window.scrollY,opener,styles:Object.fromEntries(properties.map(property => [property, {
      value:document.body.style.getPropertyValue(property),priority:document.body.style.getPropertyPriority(property)
    }]))};
    document.body.style.position = 'fixed';
    document.body.style.top = `${-scrollLock.y}px`;
    document.body.style.left = `${-scrollLock.x}px`;
    document.body.style.width = `${width}px`;
    dialog.showModal();
    closeButton.focus({preventScroll:true});
  };

  document.querySelectorAll('[data-gallery]').forEach(element => {
    const gallery = {element,slides:[...element.querySelectorAll('[data-gallery-slide]')],index:0,title:element.getAttribute('aria-label')};
    const status = element.querySelector('[data-gallery-count]');
    const controls = element.querySelector('[data-gallery-controls]');
    const render = () => {
      gallery.slides.forEach((slide,index) => {slide.hidden = index !== gallery.index;});
      if (status) status.textContent = `${gallery.index + 1} / ${gallery.slides.length}`;
      if (controls) controls.hidden = gallery.slides.length < 2;
      if (dialog.open && activeGallery === gallery) updatePreview();
    };
    gallery.move = step => {
      const moveFocus = gallery.slides[gallery.index].contains(document.activeElement);
      gallery.index = (gallery.index + step + gallery.slides.length) % gallery.slides.length;
      render();
      if (moveFocus) gallery.slides[gallery.index].querySelector('a').focus({preventScroll:true});
    };
    element.querySelector('[data-gallery-prev]')?.addEventListener('click',() => gallery.move(-1));
    element.querySelector('[data-gallery-next]')?.addEventListener('click',() => gallery.move(1));
    element.addEventListener('keydown',event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();gallery.move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    gallery.slides.forEach(slide => {
      slide.querySelector('a').addEventListener('click',event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();openPreview(gallery,event.currentTarget);
      });
    });
    element.closest('article').querySelector('[data-open-genuss]')?.addEventListener('click',event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();openPreview(gallery,event.currentTarget);
    });
    render();
  });

  closeButton.addEventListener('click',closePreview);
  dialog.addEventListener('click',event => {if (event.target === dialog) closePreview();});
  dialog.addEventListener('cancel',event => {event.preventDefault();closePreview();});
  dialog.addEventListener('close',() => {if (!dialog.open) restorePage();});
  largePrev.addEventListener('click',() => activeGallery.move(-1));
  largeNext.addEventListener('click',() => activeGallery.move(1));
  dialog.addEventListener('keydown',event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();activeGallery.move(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button')].filter(button => !button.hidden);
      const first = buttons[0],last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('pagehide',closePreview);
})();
