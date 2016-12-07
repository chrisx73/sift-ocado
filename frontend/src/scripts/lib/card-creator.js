export function cardCreator(data){
  const familyExamples = {
    Cruciferous: 'broccoli, kale, cauliflower',
    'Green leafy': 'lettuce, spinach, parsley',
    Allium: 'onion, garlic, leek',
    'Yellow/Orange': 'pumpkin, butternut squash',
    Citrus: 'orange, lemon, grapefruit',
    Berry: 'strawberries, blackberries'
  };
  const parent = document.querySelector('#nscore');
  if(!parent) {
    console.error('missing parent node from html');
    return
  }
  parent.innerHTML = '';
  Object.keys(data).forEach(k => {
    const node = document.querySelector('#card-template');
    if(!node) {
      console.error('missing template node from html');
      return
    }
    const ct = document.querySelector('#card-template').cloneNode(true);
    const recBox = ct.content.querySelector('.card__box--recommend');
    const recBoxItems = recBox.querySelector('.card__box__items');
    const boughtBoxItems = ct.content.querySelector('.card__box--bought .card__box__items');
    const parentCard = ct.content.querySelector('.card');
    parentCard.classList.add('card--' + k.toLowerCase().replace(/\/|\s/, '-'));
    ct.content.querySelector('.card__family__name').innerHTML = k;
    ct.content.querySelector('.card__family__examples').innerHTML = [familyExamples[k], '...'].join(', ');
    const s = data[k].suggestions;
    if(s.length > 0){
      const e = Math.floor(Math.random() * s.length);
      recBoxItems.appendChild(createItem(s[e].name, s[e].score));
    }else{
      const starTemp = document.querySelector('#item-star');
      recBox.innerHTML = '';
      recBox.appendChild(document.importNode(starTemp.content, true));
    }

    const f = data[k].found;
    if(f.length > 0){
      f.map(d => boughtBoxItems.appendChild(createItem(d.name, d.score)))
    }

    parent.appendChild(document.importNode(ct.content, true));
  });
}

function createItem(name, score){
  const node = document.querySelector('#item-template');
  if(!node) {
    console.error('missing template node from html');
    return;
  }
  const t = node.cloneNode(true);
  t.content.querySelector('.item__name .item__name__label').innerHTML = name;
  t.content.querySelector('.item__score').innerHTML = `${score}%`;
  // 230px - 45px(number) = 185px / 100 = 1.9
  t.content.querySelector('.item__name').style.flex = `0 1 ${1.85 * score}px`;
  return document.importNode(t.content, true)
}
