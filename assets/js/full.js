
//> basic set up Initialization - canvas, buttons, coordinates, pixelData, rubberbandDiv, isMouseDown, history
var canvas = document.getElementById('canvas'),
    tempCanvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    tempCanvasContext = tempCanvas.getContext('2d'),
    rubberbandDiv = document.getElementById('rubberbandDiv'),
    resetButton = document.getElementById('resetButton'),
    undoButton = document.getElementById('undoButton'),
    redoButton = document.getElementById('redoButton'),
    increaseBrightness = document.getElementById('ib'),
    decreaseBrightness = document.getElementById('db'),
    increaseContrast = document.getElementById('ic'),
    decreaseContrast = document.getElementById('dc'),
    rotateleft = document.getElementById('rl'),
    rotateright = document.getElementById('rr'),
    zoomin = document.getElementById('zi'),
    zoomout = document.getElementById('zo'),
    grayscaleFilter = document.getElementById('grayscaleFilter'),
    sepiaFilter = document.getElementById('sepiaFilter'),
    blurFilter = document.getElementById('blurFilter'),
    sharpenFilter = document.getElementById('sharpenFilter'),
    enhanceContrastFilter = document.getElementById('enhanceContrastFilter'),
    removeFilter = document.getElementById('removeFilter'),
    textInput = document.getElementById('textInput'),
    fontSelect = document.getElementById('fontSelect'),
    fontSize = document.getElementById('fontSize'),
    fontColor = document.getElementById('fontColor'),
    addTextButton = document.getElementById('addTextButton'),
    body = document.getElementById('body_1'),
    image = new Image(),
    mousedown = {},
    rubberbandRectangle = {},
    dragging = false,
    centerShiftX,
    centerShiftY,
    originalPixelData,
    ratio,
    isMouseDown = false,
    editorHistory = {},
    historyStack = [],
    historyIndex = -1,
    maxHistoryLength = 10,
    textPosition = null,
    isAddingText = false;

//> our temp canvas set up
tempCanvas.setAttribute('width','800');
tempCanvas.setAttribute('height', '520');

//> History Management Functions
function saveHistory() {
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }
    
    historyStack.push({
        imageData: imageData,
        data: JSON.stringify(Array.from(imageData.data))
    });
    
    if (historyStack.length > maxHistoryLength) {
        historyStack.shift();
    } else {
        historyIndex++;
    }
    
    updateHistoryButtons();
}

function updateHistoryButtons() {
    undoButton.disabled = historyIndex <= 0;
    redoButton.disabled = historyIndex >= historyStack.length - 1;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreHistory(historyIndex);
        updateHistoryButtons();
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreHistory(historyIndex);
        updateHistoryButtons();
    }
}

function restoreHistory(index) {
    if (index >= 0 && index < historyStack.length) {
        var historyItem = historyStack[index];
        var imageData;
        
        if (historyItem.imageData) {
            imageData = historyItem.imageData;
        } else if (historyItem.data) {
            var dataArray = new Uint8ClampedArray(JSON.parse(historyItem.data));
            imageData = new ImageData(dataArray, canvas.width, canvas.height);
        }
        
        if (imageData) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(imageData, 0, 0);
        }
    }
}

//> function to zoom in
function zoomPlus(){
  var scale = parseFloat(zoomin.getAttribute('data-step'));
  var currentvalue = parseFloat(zoomin.getAttribute('data-currentvalue'));
  var maxVal = parseFloat(zoomin.getAttribute('data-max'));
  var delta = scale + currentvalue;
  if(delta < maxVal){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    zoomin.setAttribute('data-currentvalue', delta);
    zoomout.setAttribute('data-currentvalue', delta);
    context.scale(scale, scale);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
  }
}

//> function to zoom out
function zoomMinus(){
  var scale = parseFloat(zoomout.getAttribute('data-step'));
  var currentvalue = parseFloat(zoomout.getAttribute('data-currentvalue'));
  var minVal = parseFloat(zoomout.getAttribute('data-min'));
  var delta = -scale + currentvalue;
  if(delta > minVal){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    zoomin.setAttribute('data-currentvalue', delta);
    zoomout.setAttribute('data-currentvalue', delta);
    context.scale(scale, scale);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
  }
}

//> function that deals with incrasing contrast
function contrastUp(){
  var step = parseInt(increaseContrast.getAttribute('data-step'));
  var currentvalue = parseInt(increaseContrast.getAttribute('data-currentvalue'));
  var delta = (step) + (currentvalue);
  var maxVal = parseInt(increaseContrast.getAttribute('data-max'));

  if(delta < maxVal){
    tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCanvasContext.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    var pixels = tempCanvasContext.getImageData(0, 0, tempCanvas.width,tempCanvas.height);
    var pixelDataArray = pixels.data;
    decreaseContrast.setAttribute('data-currentvalue',delta);
    increaseContrast.setAttribute('data-currentvalue',delta);
    editorHistory['contrast'] = delta;
    console.log('Beginning increaseContrast...');
    delta = Math.floor(255 * (delta / 100));
    for (var i = 0; i < pixelDataArray.length; i += 4) {
      var brightness = (pixelDataArray[i]+pixelDataArray[i+1]+pixelDataArray[i+2])/3; //get the brightness
      pixelDataArray[i] += (brightness > 127) ? delta : -delta; // red
      pixelDataArray[i + 1] += (brightness > 127) ? delta : -delta; // green
      pixelDataArray[i + 2] += (brightness > 127) ? delta : -delta; // blue
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(pixels, 0, 0);
    saveHistory();
    console.log('complete increaseContrast...');
  }
}

//> function that deals with contrast reduction
function contrastDown(){
  var step = parseInt(decreaseContrast.getAttribute('data-step'));
  var currentvalue = parseInt(decreaseContrast.getAttribute('data-currentvalue'));
  var delta = (step) + (currentvalue);
  var minVal = parseInt(decreaseContrast.getAttribute('data-min'));

  if(delta > minVal){
    tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCanvasContext.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    var pixels = tempCanvasContext.getImageData(0, 0, tempCanvas.width,tempCanvas.height);
    var pixelDataArray = pixels.data;
    decreaseContrast.setAttribute('data-currentvalue',delta);
    increaseContrast.setAttribute('data-currentvalue',delta);
    editorHistory['contrast'] = delta;
    console.log('Beginning decreaseContrast...');
    delta = Math.floor(255 * (delta / 100));
    for (var i = 0; i < pixelDataArray.length; i += 4) {
      var brightness = (pixelDataArray[i]+pixelDataArray[i+1]+pixelDataArray[i+2])/3; //get the brightness
      pixelDataArray[i] += (brightness > 127) ? delta : -delta; // red
      pixelDataArray[i + 1] += (brightness > 127) ? delta : -delta; // green
      pixelDataArray[i + 2] += (brightness > 127) ? delta : -delta; // blue
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(pixels, 0, 0);
    saveHistory();
    console.log('complete decreaseContrast...');
  }
}

//> rotate anti clockwise
function rotateAntiClockWise(){
  var angle = parseInt(rotateleft.getAttribute('data-step'));
  var currentvalue = parseInt(rotateleft.getAttribute('data-currentvalue'));
  var delta = angle + currentvalue;

  if(delta >= -359){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    rotateleft.setAttribute('data-currentvalue', delta);
    rotateright.setAttribute('data-currentvalue', delta);
    context.rotate(angle * Math.PI / 180);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
  }
}

//> rotate clockwise
function rotateClockWise(){
  var angle = parseInt(rotateright.getAttribute('data-step'));
  var currentvalue = parseInt(rotateright.getAttribute('data-currentvalue'));
  var delta = angle + currentvalue;

  if(delta < 360){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    rotateleft.setAttribute('data-currentvalue', delta);
    rotateright.setAttribute('data-currentvalue', delta);
    context.rotate(angle * Math.PI / 180);
    context.translate(-canvas.width / 2, -canvas.height / 2);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
  }
}

//> function to increase brightness
function brightnessPlus(){
  var step = parseInt(increaseBrightness.getAttribute('data-step'));
  var currentvalue = parseInt(increaseBrightness.getAttribute('data-currentvalue'));
  var delta = (step) + (currentvalue);
  var maxVal = parseInt(increaseBrightness.getAttribute('data-max'));

  if(delta < maxVal){
    tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCanvasContext.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    var pixels = tempCanvasContext.getImageData(0, 0, tempCanvas.width,tempCanvas.height);
    var pixelDataArray = pixels.data;
    decreaseBrightness.setAttribute('data-currentvalue',delta);
    increaseBrightness.setAttribute('data-currentvalue',delta);
    editorHistory['brightness'] = delta;
    console.log('Beginning increaseBrightness...');
    delta = Math.floor(255 * (delta / 100));
    for (var i = 0; i < pixelDataArray.length; i += 4) {
      pixelDataArray[i] = pixelDataArray[i] + delta; // red
      pixelDataArray[i + 1] += delta; // green
      pixelDataArray[i + 2] += delta; // blue
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(pixels, 0, 0);
    saveHistory();
    console.log('complete increaseBrightness...');
  }
}

//> function to decrease brightness
function brightnessMinus(){
  var step = parseInt(decreaseBrightness.getAttribute('data-step'));
  var currentvalue = parseInt(decreaseBrightness.getAttribute('data-currentvalue'));
  var delta = step + currentvalue;
  var minVal = parseInt(decreaseBrightness.getAttribute('data-min'));

  if(delta > minVal){
    tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCanvasContext.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    var pixels = tempCanvasContext.getImageData(0, 0, tempCanvas.width,tempCanvas.height);
    var pixelDataArray = pixels.data;
    increaseBrightness.setAttribute('data-currentvalue',delta);
    decreaseBrightness.setAttribute('data-currentvalue',delta);
    editorHistory['brightness'] = delta;
    console.log('Beginning decreaseBrightness...');
    delta = Math.floor(255 * (delta / 100));
    for (var i = 0; i < pixelDataArray.length; i += 4) {
      pixelDataArray[i] = pixelDataArray[i] + delta; // red
      pixelDataArray[i + 1] += delta; // green
      pixelDataArray[i + 2] += delta; // blue
    }
    context.putImageData(pixels, 0, 0);
    saveHistory();
    console.log('complete decreaseBrightness...');
  }
}

//> Filter Functions
function applyGrayscale() {
    console.log('Applying grayscale filter...');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    
    for (var i = 0; i < data.length; i += 4) {
        var gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;     // red
        data[i + 1] = gray; // green
        data[i + 2] = gray; // blue
    }
    
    context.putImageData(imageData, 0, 0);
    saveHistory();
    console.log('Grayscale filter applied.');
}

function applySepia() {
    console.log('Applying sepia filter...');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    
    for (var i = 0; i < data.length; i += 4) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];
        
        data[i] = Math.min(255, 0.393 * red + 0.769 * green + 0.189 * blue);
        data[i + 1] = Math.min(255, 0.349 * red + 0.686 * green + 0.168 * blue);
        data[i + 2] = Math.min(255, 0.272 * red + 0.534 * green + 0.131 * blue);
    }
    
    context.putImageData(imageData, 0, 0);
    saveHistory();
    console.log('Sepia filter applied.');
}

function applyBlur() {
    console.log('Applying blur filter...');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var width = canvas.width;
    var height = canvas.height;
    var tempData = new Uint8ClampedArray(data);
    var blurRadius = 2;
    
    for (var y = blurRadius; y < height - blurRadius; y++) {
        for (var x = blurRadius; x < width - blurRadius; x++) {
            var totalRed = 0, totalGreen = 0, totalBlue = 0, totalAlpha = 0;
            var pixelCount = 0;
            
            for (var offsetY = -blurRadius; offsetY <= blurRadius; offsetY++) {
                for (var offsetX = -blurRadius; offsetX <= blurRadius; offsetX++) {
                    var pixelIndex = ((y + offsetY) * width + (x + offsetX)) * 4;
                    totalRed += tempData[pixelIndex];
                    totalGreen += tempData[pixelIndex + 1];
                    totalBlue += tempData[pixelIndex + 2];
                    totalAlpha += tempData[pixelIndex + 3];
                    pixelCount++;
                }
            }
            
            var currentIndex = (y * width + x) * 4;
            data[currentIndex] = totalRed / pixelCount;
            data[currentIndex + 1] = totalGreen / pixelCount;
            data[currentIndex + 2] = totalBlue / pixelCount;
            data[currentIndex + 3] = totalAlpha / pixelCount;
        }
    }
    
    context.putImageData(imageData, 0, 0);
    saveHistory();
    console.log('Blur filter applied.');
}

function applySharpen() {
    console.log('Applying sharpen filter...');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var width = canvas.width;
    var height = canvas.height;
    var tempData = new Uint8ClampedArray(data);
    
    var kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];
    var kernelSize = 3;
    var kernelOffset = Math.floor(kernelSize / 2);
    
    for (var y = kernelOffset; y < height - kernelOffset; y++) {
        for (var x = kernelOffset; x < width - kernelOffset; x++) {
            var red = 0, green = 0, blue = 0;
            
            for (var ky = 0; ky < kernelSize; ky++) {
                for (var kx = 0; kx < kernelSize; kx++) {
                    var pixelX = x + kx - kernelOffset;
                    var pixelY = y + ky - kernelOffset;
                    var pixelIndex = (pixelY * width + pixelX) * 4;
                    var kernelValue = kernel[ky * kernelSize + kx];
                    
                    red += tempData[pixelIndex] * kernelValue;
                    green += tempData[pixelIndex + 1] * kernelValue;
                    blue += tempData[pixelIndex + 2] * kernelValue;
                }
            }
            
            var currentIndex = (y * width + x) * 4;
            data[currentIndex] = Math.min(255, Math.max(0, red));
            data[currentIndex + 1] = Math.min(255, Math.max(0, green));
            data[currentIndex + 2] = Math.min(255, Math.max(0, blue));
        }
    }
    
    context.putImageData(imageData, 0, 0);
    saveHistory();
    console.log('Sharpen filter applied.');
}

function applyEnhanceContrast() {
    console.log('Applying enhance contrast filter...');
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    
    var factor = 1.5;
    var intercept = 128 * (1 - factor);
    
    for (var i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
    }
    
    context.putImageData(imageData, 0, 0);
    saveHistory();
    console.log('Enhance contrast filter applied.');
}

function removeAllFilters() {
    console.log('Removing all filters...');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
    console.log('All filters removed.');
}

//> Text Annotation Functions
function setTextPosition(x, y) {
    textPosition = { x: x, y: y };
    isAddingText = true;
    
    var text = textInput.value;
    var font = fontSelect.value;
    var size = fontSize.value;
    var color = fontColor.value;
    
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
    
    context.font = size + 'px ' + font;
    context.fillStyle = color;
    context.fillText(text, x, y);
    
    console.log('Text position set at: ' + x + ', ' + y);
}

function confirmText() {
    if (!textPosition) {
        alert('Please click on the canvas to position the text first.');
        return;
    }
    
    var text = textInput.value;
    if (!text || text.trim() === '') {
        alert('Please enter some text.');
        return;
    }
    
    var font = fontSelect.value;
    var size = fontSize.value;
    var color = fontColor.value;
    
    context.font = size + 'px ' + font;
    context.fillStyle = color;
    context.fillText(text, textPosition.x, textPosition.y);
    
    saveHistory();
    
    textPosition = null;
    isAddingText = false;
    
    console.log('Text added: ' + text);
}

//> Functions for CROP ----- START

//> this is executed on mouse down
function rubberbandStart(x, y) {
    if (isAddingText) {
        return;
    }
    
    mousedown.x = x;
    mousedown.y = y;
    
    rubberbandRectangle.left = mousedown.x;
    rubberbandRectangle.top = mousedown.y;
    
    moveRubberbandDiv();
    showRubberbandDiv();
}

//> this is executed on mousemove
function rubberbandStretch(x, y) {
    if (isAddingText) {
        return;
    }
    
    var canvasCoordinates = canvas.getBoundingClientRect();
    rubberbandRectangle.left = (x < mousedown.x) ? x : mousedown.x;
    rubberbandRectangle.top  = (y < mousedown.y) ? y : mousedown.y;
    
    rubberbandRectangle.width  = Math.abs(x - mousedown.x),
    rubberbandRectangle.height = Math.abs(y - mousedown.y);
    
    var isXinRange = rubberbandRectangle.left > canvasCoordinates.left && x < canvasCoordinates.right;
    var isYinRange = rubberbandRectangle.top > canvasCoordinates.top && y < canvasCoordinates.bottom;
    if(isXinRange && isYinRange){
        moveRubberbandDiv();
        resizeRubberbandDiv();
    }
}

//> This is executed on mouseup
function rubberbandEnd() {
    if (isAddingText) {
        return;
    }
    
    if(dragging){
        var bbox = canvas.getBoundingClientRect();
        
        try {
            tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCanvasContext.drawImage(canvas,
                rubberbandRectangle.left - bbox.left,
                rubberbandRectangle.top - bbox.top,
                rubberbandRectangle.width,
                rubberbandRectangle.height,
                centerShiftX, centerShiftY, rubberbandRectangle.width * ratio, rubberbandRectangle.height * ratio);
            var imageData = tempCanvasContext.getImageData(0,0,tempCanvas.width,tempCanvas.height);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(imageData, 0, 0);
            tempCanvasContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            saveHistory();
        }
        catch (e) {
            console.log(e);
        }
        
        resetRubberbandRectangle();
        rubberbandDiv.style.width = 0;
        rubberbandDiv.style.height = 0;
        hideRubberbandDiv();
        dragging = false;
    }
}

//> move the rubberbandDiv to that position - so set the style values
function moveRubberbandDiv() {
    rubberbandDiv.style.top  = rubberbandRectangle.top  + 'px';
    rubberbandDiv.style.left = rubberbandRectangle.left + 'px';
}

//> set the new height and width & prevent rubberband from exceeding canvas width & height
function resizeRubberbandDiv() {
    rubberbandDiv.style.width  = rubberbandRectangle.width  + 'px';
    rubberbandDiv.style.height = rubberbandRectangle.height + 'px';
}

//> show the rubber band DIV
function showRubberbandDiv() {
    rubberbandDiv.style.display = 'inline';
}

//> hide the rubbber band DIV
function hideRubberbandDiv() {
    rubberbandDiv.style.display = 'none';
}

//> once the operation is done. Reset the rubberbandDiv
function resetRubberbandRectangle() {
    rubberbandRectangle = { top: 0, left: 0, width: 0, height: 0 };
}

//> Functions for CROP ----- END

function calculateRotation(degree){
    var actual = 0;
    if (degree >= 0){
        if(value >=0 && value <= 359){
            actual = degree;
        }else {
            actual = degree - 360;
        }
    }else{
        if(degree >= -360){
            actual = degree + 360;
        }else{
            actual = 2(360) + degree;
        }
    }
    return actual;
}

//> Event handlers
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

increaseContrast.addEventListener('click', contrastUp);
decreaseContrast.addEventListener('click', contrastDown);
rotateleft.addEventListener('click', rotateAntiClockWise);
rotateright.addEventListener('click', rotateClockWise);
increaseBrightness.addEventListener('click', brightnessPlus);
decreaseBrightness.addEventListener('click', brightnessMinus);
zoomin.addEventListener('click', zoomPlus);
zoomout.addEventListener('click', zoomMinus);

//> Filter event handlers
grayscaleFilter.addEventListener('click', applyGrayscale);
sepiaFilter.addEventListener('click', applySepia);
blurFilter.addEventListener('click', applyBlur);
sharpenFilter.addEventListener('click', applySharpen);
enhanceContrastFilter.addEventListener('click', applyEnhanceContrast);
removeFilter.addEventListener('click', removeAllFilters);

//> Text annotation event handlers
addTextButton.addEventListener('click', confirmText);

//> what is to be done when mousedown occurs on canvas
canvas.onmousedown = function (e) {
    isMouseDown = true;
    var x = e.clientX,
        y = e.clientY;
    
    e.preventDefault();
    
    if (isAddingText || textInput.value.trim() !== '') {
        var canvasRect = canvas.getBoundingClientRect();
        var canvasX = x - canvasRect.left;
        var canvasY = y - canvasRect.top;
        setTextPosition(canvasX, canvasY);
    } else {
        rubberbandStart(x, y);
    }
};

//> what is to be done when mouse moves on canvas
canvas.onmousemove = function (e) {
    if(isMouseDown){
        dragging = true;
        var x = e.clientX,
            y = e.clientY;
        
        e.preventDefault();
        if (dragging && !isAddingText) {
            rubberbandStretch(x, y);
        }
    }
};

//> execute rule on mouse up
window.onmouseup = function (e) {
    isMouseDown = false;
    e.preventDefault();
    rubberbandEnd();
};

//> once the image has loaded - draw the image - this is the 1st of many draws
image.onload = function () {
    var wRatio = canvas.width/image.width;
    var hRatio = canvas.height/image.height;
    ratio = Math.min(hRatio, wRatio);
    centerShiftX = (canvas.width - image.width * ratio) / 2;
    centerShiftY = (canvas.height - image.height * ratio) / 2;
    context.save();
    var pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    originalPixelData = [];
    for (var i = 0; i < pixelData.length; i = i + 1) {
        var pixel = pixelData[i];
        originalPixelData[i] = pixel;
    }
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    
    saveHistory();
};

//> click on reset button
resetButton.onclick = function(e) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(image, 0, 0, image.width, image.height, centerShiftX, centerShiftY, image.width * ratio, image.height * ratio);
    saveHistory();
};

//> Initialization of the image
image.src = 'assets/img/scenery.jpg';