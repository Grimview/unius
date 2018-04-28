const fs = require('fs');
const path = require('path');
const {remote} = require('electron');
const {BrowserWindow, dialog} = remote;

var closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', function() {
  BrowserWindow.getFocusedWindow().close();
});

var minButton = document.getElementById('minimise-button');
minButton.addEventListener('click', function() {
  BrowserWindow.getFocusedWindow().minimize();
});

var maxButton = document.getElementById('maximise-button');
maxButton.addEventListener('click', function() {
  if (BrowserWindow.getFocusedWindow().isMaximized()) {
    BrowserWindow.getFocusedWindow().unmaximize();
  } else {
    BrowserWindow.getFocusedWindow().maximize();
  }
});

var items = document.getElementById('items');
var upOneButton = document.getElementById('up-one');
var tabs = document.getElementById('tabs');

var jsonDocument = path.join(__dirname, 'assets', 'docs', 'test.json');

var jsonContent = fs.readFileSync(jsonDocument);

var obj = JSON.parse(jsonContent);

var currentPath = [];

// generateList(obj);

var loadButton = document.getElementById('open-file');

loadButton.onclick = function() {
  jsonDocument = dialog.showOpenDialog({filters: [{name: 'JSON Document', extensions: ['json']}], properties: ['openFile']})[0];

  jsonContent = fs.readFileSync(jsonDocument);

  obj = JSON.parse(jsonContent);

  currentPath = [];
  upOneButton.disabled = true;

  clearChildren();

  generateList(obj);

  for (let currentTab = 0; currentTab < tabs.childNodes.length; currentTab++) {
    if (tabs.childNodes[currentTab].classList.contains('active')) {
      tabs.childNodes[currentTab].classList.remove('active');
    }
  }

  let thisTab = document.createElement('li');
  let documentSplit = jsonDocument.split('\\');
  thisTab.textContent = documentSplit[documentSplit.length - 1].slice(0, -5);
  thisTab.setAttribute('data-document', jsonDocument);
  thisTab.classList.add('active');

  thisTab.addEventListener('mouseup', function(event) {
    if (event.button === 0) {
      if (!this.classList.contains('active')) {
        for (let currentTab = 0; currentTab < tabs.childNodes.length; currentTab++) {
          if (tabs.childNodes[currentTab].classList.contains('active')) {
            tabs.childNodes[currentTab].classList.remove('active');
          }
        }
  
        this.classList.add('active');

        jsonDocument = this.getAttribute('data-document');
  
        jsonContent = fs.readFileSync(jsonDocument);
  
        obj = JSON.parse(jsonContent);
  
        currentPath = [];
        upOneButton.disabled = true;
  
        clearChildren();
  
        generateList(obj);
      }
    } else if (event.button === 2) {
      if (this.classList.contains('active')) {
        clearChildren();
      }

      tabs.removeChild(this);
    }
  });

  tabs.appendChild(thisTab);
}

function clearChildren() {
  while (items.childNodes[0]) {
    items.removeChild(items.childNodes[0]);
  }
}

function generateList(thisPath) {
  let keys = Object.keys(thisPath);

  currentPath.push(thisPath);

  for (let thisKey = 0; thisKey < keys.length; thisKey++) {
    let thisKeyString = keys[thisKey].toString();

    let listItem = document.createElement('li');

    let description, title;

    switch (typeof thisPath[thisKeyString]) {
      case 'string':
        // Audio
        if (thisPath[thisKeyString].includes('.mp3') || thisPath[thisKeyString].includes('.ogg') || thisPath[thisKeyString].includes('.wav')) {
          title = document.createElement('h6');
          title.textContent = thisKeyString;
          listItem.appendChild(title);
          
          description = document.createElement('audio');
          description.controls = 'controls';

          let audioSource = document.createElement('source');
          audioSource.src = thisPath[thisKeyString];
          audioSource.type = 'audio/mp3';

          description.appendChild(audioSource);
        // Images
        } else if (thisPath[thisKeyString].includes('.jpg') || thisPath[thisKeyString].includes('.gif') || thisPath[thisKeyString].includes('.png')) {
          title = document.createElement('h6');
          title.textContent = thisKeyString;
          listItem.appendChild(title);

          description = document.createElement('img');
          description.src = thisPath[thisKeyString];
        // Strings
        } else {
          description = createInput(thisPath, thisKeyString, 'text');
        }
        break;
      
      case 'number':
        description = createInput(thisPath, thisKeyString, 'number');
        break;
      
      case 'boolean':
        description = createBoolean(thisPath, thisKeyString);
        break;
      
      case 'object':
        title = document.createElement('h6');
        title.textContent = thisKeyString;
        listItem.appendChild(title);

        let objectKeys = Object.keys(thisPath[thisKeyString]);

        description = document.createElement('div');

        for (let thisObjectKey = 0; thisObjectKey < objectKeys.length; thisObjectKey++) {
          switch (typeof thisPath[thisKeyString][objectKeys[thisObjectKey]]) {
            case 'boolean':
              thisButton = createBoolean(thisPath[thisKeyString], objectKeys[thisObjectKey]);
              break;

            case 'number':
              thisButton = createInput(thisPath[thisKeyString], objectKeys[thisObjectKey], 'number');
              break;

            case 'string':
              thisButton = createInput(thisPath[thisKeyString], objectKeys[thisObjectKey], 'text');
              break;
            
            case 'object':
              thisButton = document.createElement('button');
              thisButton.classList.add('button');
              thisButton.textContent = objectKeys[thisObjectKey];

              thisButton.onclick = function() {
                clearChildren();
                
                if (typeof thisPath[thisKeyString][objectKeys[thisObjectKey]] === 'object') {
                  generateList(thisPath[thisKeyString][objectKeys[thisObjectKey]]);
                } else {
                  generateList(thisPath[thisKeyString]);
                }
                
                upOneButton.disabled = false;
      
                upOneButton.onclick = function() {
                  if (currentPath.length > 1) {
                    clearChildren();
      
                    currentPath.pop();
      
                    let upPath = currentPath[currentPath.length - 1];
                    
                    generateList(upPath);
                    currentPath.pop();
      
                    if (currentPath.length <= 1) {
                      upOneButton.disabled = true;
                    }
                  }
                }
              }
              break;
          }

          description.appendChild(thisButton);
        }
        break;
    }

    listItem.appendChild(description);

    items.appendChild(listItem);
  }
}

function createBoolean(path, key) {
  let thisDescription = document.createElement('input');
  thisDescription.type = 'checkbox';
  thisDescription.setAttribute('data-role', 'switch');
  thisDescription.setAttribute('data-caption', key);
  thisDescription.checked = path[key];

  thisDescription.addEventListener('change', function() {
    path[key] = this.checked;

    fs.writeFileSync(jsonDocument, JSON.stringify(obj, null, 2));
  });

  return thisDescription;
}

function createInput(path, key, kind) {
  let thisDescription = document.createElement('input');
  switch (kind) {
    case 'text':
      thisDescription.type = 'text';
      break;
    
    case 'number':
      thisDescription.type = 'number';
      break;
  }
  thisDescription.setAttribute('data-role', 'input');
  thisDescription.setAttribute('data-prepend', key);
  thisDescription.value = path[key];

  thisDescription.addEventListener('change', function() {
    switch (kind) {
      case 'text':
        path[key] = this.value;
        break;
      
      case 'number':
        path[key] = Number(this.value);
        break;
    }

    fs.writeFileSync(jsonDocument, JSON.stringify(obj, null, 2));
  });

  return thisDescription;
}