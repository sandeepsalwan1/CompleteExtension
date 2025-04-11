// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "analyze") {
    // Start the analysis process
    startAnalysis();
    sendResponse({status: "analyzing"});
    return true; // Keep the message channel open for asynchronous response
  }
  
  if (message.action === "highlightFact") {
    highlightText(message.text, message.isFactual, message.correction, message.sourceURL, message.evidenceText);
    sendResponse({status: "highlighted"});
    return true;
  }
});

// Function to start the analysis process
function startAnalysis() {
  // Extract article content
  const articleData = extractArticleContent();
  
  // Send the extracted content to the background script for processing
  chrome.runtime.sendMessage({
    action: "processArticle",
    article: articleData
  });
}

// Function to extract article content from the page
function extractArticleContent() {
  // Initialize article data
  const articleData = {
    title: document.title,
    url: window.location.href,
    mainContent: "",
    paragraphs: [],
    metadata: {}
  };
  
  // Try to find the article content using common article selectors
  const selectors = [
    'article',
    '.article',
    '.post-content',
    '.entry-content',
    '.content',
    'main',
    '#content',
    '.story',
    '.news-article'
  ];
  
  // Find the article container
  let articleContainer = null;
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      articleContainer = element;
      break;
    }
  }
  
  // If no article container found, use the body
  if (!articleContainer) {
    articleContainer = document.body;
  }
  
  // Extract the main heading
  const headingSelectors = ['h1', '.headline', '.article-title', '.entry-title'];
  for (const selector of headingSelectors) {
    const headingElement = articleContainer.querySelector(selector);
    if (headingElement) {
      articleData.title = headingElement.textContent.trim();
      break;
    }
  }
  
  // Extract author if available
  const authorSelectors = ['.author', '.byline', '.article-meta', 'meta[name="author"]'];
  for (const selector of authorSelectors) {
    const authorElement = document.querySelector(selector);
    if (authorElement) {
      if (selector === 'meta[name="author"]') {
        articleData.metadata.author = authorElement.getAttribute('content');
      } else {
        articleData.metadata.author = authorElement.textContent.trim();
      }
      break;
    }
  }
  
  // Extract date if available
  const dateSelectors = [
    'time', 
    '.date', 
    '.published', 
    '.post-date', 
    'meta[property="article:published_time"]'
  ];
  
  for (const selector of dateSelectors) {
    const dateElement = document.querySelector(selector);
    if (dateElement) {
      if (selector === 'meta[property="article:published_time"]') {
        articleData.metadata.date = dateElement.getAttribute('content');
      } else if (dateElement.hasAttribute('datetime')) {
        articleData.metadata.date = dateElement.getAttribute('datetime');
      } else {
        articleData.metadata.date = dateElement.textContent.trim();
      }
      break;
    }
  }
  
  // Extract all paragraphs from the article
  const paragraphs = articleContainer.querySelectorAll('p');
  paragraphs.forEach(paragraph => {
    const text = paragraph.textContent.trim();
    if (text.length > 20) { // Only include paragraphs with substantial content
      articleData.paragraphs.push(text);
      articleData.mainContent += text + " ";
    }
  });
  
  // Clean up the main content
  articleData.mainContent = articleData.mainContent.trim();
  
  return articleData;
}

// Map to track which corrections have been added to the footnote
const addedCorrections = new Map();

// Function to highlight text and add corrections if needed
function highlightText(text, isFactual, correction, sourceURL, evidenceText) {
  if (!text) return; // Skip if text is empty
  
  // Clear the correction map for new analysis
  if (document.getElementById('news-fact-checker-corrections')) {
    document.getElementById('news-fact-checker-corrections').remove();
    addedCorrections.clear();
  }
  
  // Find specific numerical values to highlight if we have a correction
  const valuesToHighlight = [];
  
  if (correction) {
    // Extract the original value to precisely target it
    valuesToHighlight.push({
      value: correction.originalValue,
      replacement: correction.correctedValue
    });
  }
  
  const textNodes = [];
  
  // Find all text nodes in the document
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.includes(text)) {
      textNodes.push(node);
    } else if (correction && node.nodeValue.includes(correction.originalValue)) {
      // Also find nodes that contain just the original value for more precise highlighting
      textNodes.push(node);
    }
  }
  
  // Highlight each occurrence
  textNodes.forEach(node => {
    const parent = node.parentNode;
    const content = node.nodeValue;
    
    // If we have a specific value to highlight
    if (correction && content.includes(correction.originalValue)) {
      // More precise highlighting of just the numerical value
      const parts = content.split(correction.originalValue);
      
      if (parts.length > 1) {
        // Create fragment to hold the new nodes
        const fragment = document.createDocumentFragment();
        
        // Add the first part
        if (parts[0]) {
          fragment.appendChild(document.createTextNode(parts[0]));
        }
        
        // Create the highlighted element for just the numerical value
        const highlightedSpan = document.createElement('span');
        highlightedSpan.dataset.factChecked = 'true';
        highlightedSpan.classList.add('fact-correction');
        
        // Style for incorrect value
        highlightedSpan.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
        highlightedSpan.style.border = '1px solid rgba(244, 67, 54, 0.5)';
        highlightedSpan.style.borderRadius = '2px';
        highlightedSpan.style.position = 'relative';
        highlightedSpan.style.textDecoration = 'line-through';
        
        // Create a more detailed tooltip with source information
        const tooltipTitle = sourceURL ? 
          `Correction: ${correction.originalValue} → ${correction.correctedValue}. Source: ${evidenceText}` :
          `Correction: ${correction.originalValue} → ${correction.correctedValue}`;
        
        highlightedSpan.title = tooltipTitle;
        
        // Add original value with strikethrough
        highlightedSpan.textContent = correction.originalValue;
        
        // Add enhanced tooltip that appears on hover
        const tooltip = document.createElement('span');
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-24px';
        tooltip.style.left = '0';
        tooltip.style.backgroundColor = '#fff';
        tooltip.style.border = '1px solid #ccc';
        tooltip.style.padding = '6px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        tooltip.style.zIndex = '1000';
        tooltip.style.fontSize = '12px';
        tooltip.style.color = '#333';
        tooltip.style.display = 'none';
        tooltip.style.maxWidth = '300px';
        tooltip.style.lineHeight = '1.5';
        tooltip.style.whiteSpace = 'normal';
        tooltip.style.fontFamily = 'Arial, sans-serif';
        
        // Add corrected value with better formatting
        const correctionText = document.createElement('div');
        correctionText.style.fontWeight = 'bold';
        correctionText.style.color = '#4CAF50';
        correctionText.style.marginBottom = '4px';
        correctionText.innerHTML = `Correct value: <span style="color:#4CAF50">${correction.correctedValue}</span>`;
        tooltip.appendChild(correctionText);
        
        // Add source information with more detail
        if (sourceURL && evidenceText) {
          const sourceInfo = document.createElement('div');
          sourceInfo.style.fontSize = '11px';
          sourceInfo.style.color = '#666';
          sourceInfo.style.marginBottom = '6px';
          sourceInfo.textContent = `Source: ${evidenceText}`;
          tooltip.appendChild(sourceInfo);
          
          const sourceLink = document.createElement('a');
          sourceLink.href = sourceURL;
          sourceLink.target = '_blank';
          sourceLink.textContent = 'View Source Document';
          sourceLink.style.display = 'block';
          sourceLink.style.marginTop = '4px';
          sourceLink.style.color = '#2196F3';
          sourceLink.style.textDecoration = 'none';
          sourceLink.style.fontWeight = 'bold';
          sourceLink.style.fontSize = '11px';
          tooltip.appendChild(sourceLink);
        }
        
        highlightedSpan.appendChild(tooltip);
        
        // Show tooltip on hover
        highlightedSpan.addEventListener('mouseenter', () => {
          tooltip.style.display = 'block';
        });
        
        highlightedSpan.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
        
        fragment.appendChild(highlightedSpan);
        
        // Add the remaining parts
        for (let i = 1; i < parts.length; i++) {
          if (parts[i]) {
            fragment.appendChild(document.createTextNode(parts[i]));
          }
        }
        
        // Replace the original text node with our highlighted version
        parent.replaceChild(fragment, node);
        
        // Add to footnote
        if (correction && !addedCorrections.has(correction.originalValue)) {
          addFootnoteCorrection(text, correction, sourceURL, evidenceText);
          addedCorrections.set(correction.originalValue, true);
        }
      }
    } else if (content.includes(text)) {
      // Highlight the entire claim
      const parts = content.split(text);
      
      if (parts.length > 1) {
        // Create fragment to hold the new nodes
        const fragment = document.createDocumentFragment();
        
        // Add the first part
        if (parts[0]) {
          fragment.appendChild(document.createTextNode(parts[0]));
        }
        
        // Create the highlighted element
        const highlightedSpan = document.createElement('span');
        highlightedSpan.dataset.factChecked = 'true';
        
        if (isFactual) {
          // Factually correct
          highlightedSpan.textContent = text;
          highlightedSpan.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
          highlightedSpan.style.border = '1px solid rgba(76, 175, 80, 0.3)';
          highlightedSpan.style.borderRadius = '2px';
          highlightedSpan.title = 'Factually correct';
        } else {
          // Factually incorrect
          if (correction) {
            // Create a special annotation for numerical corrections
            highlightedSpan.classList.add('fact-correction');
            highlightedSpan.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            highlightedSpan.style.border = '1px solid rgba(244, 67, 54, 0.5)';
            highlightedSpan.style.borderRadius = '2px';
            
            // Enhanced tooltip with source information
            const tooltipTitle = sourceURL ? 
              `Contains incorrect information: ${correction.originalValue} should be ${correction.correctedValue}. Source: ${evidenceText}` :
              `Contains incorrect information. See footnote for details.`;
            
            highlightedSpan.title = tooltipTitle;
            highlightedSpan.textContent = text;
            
            // Add to footnote
            if (!addedCorrections.has(correction.originalValue)) {
              addFootnoteCorrection(text, correction, sourceURL, evidenceText);
              addedCorrections.set(correction.originalValue, true);
            }
          } else {
            // Regular highlighting for non-numerical incorrect facts
            highlightedSpan.textContent = text;
            highlightedSpan.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            highlightedSpan.style.border = '1px solid rgba(244, 67, 54, 0.5)';
            highlightedSpan.style.borderRadius = '2px';
            highlightedSpan.title = 'Factually incorrect';
          }
        }
        
        fragment.appendChild(highlightedSpan);
        
        // Add the remaining parts
        for (let i = 1; i < parts.length; i++) {
          if (parts[i]) {
            fragment.appendChild(document.createTextNode(parts[i]));
          }
        }
        
        // Replace the original text node with our highlighted version
        parent.replaceChild(fragment, node);
      }
    }
  });
}

// Function to add a footnote with the correction at the end of the article
function addFootnoteCorrection(text, correction, sourceURL, evidenceText) {
  // Check if we already have a corrections footnote section
  let correctionsFootnote = document.getElementById('news-fact-checker-corrections');
  
  if (!correctionsFootnote) {
    // Create the corrections footnote section
    correctionsFootnote = document.createElement('div');
    correctionsFootnote.id = 'news-fact-checker-corrections';
    correctionsFootnote.style.margin = '30px 0';
    correctionsFootnote.style.padding = '20px';
    correctionsFootnote.style.backgroundColor = '#f8f9fa';
    correctionsFootnote.style.border = '1px solid #e0e0e0';
    correctionsFootnote.style.borderRadius = '8px';
    correctionsFootnote.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
    correctionsFootnote.style.fontFamily = 'Arial, sans-serif';
    
    const footnoteTitle = document.createElement('h3');
    footnoteTitle.textContent = 'Fact Checker Corrections';
    footnoteTitle.style.marginTop = '0';
    footnoteTitle.style.marginBottom = '15px';
    footnoteTitle.style.color = '#d32f2f';
    footnoteTitle.style.fontSize = '20px';
    correctionsFootnote.appendChild(footnoteTitle);
    
    // Add a description
    const description = document.createElement('p');
    description.textContent = 'The following corrections are based on verified data from authoritative sources:';
    description.style.marginBottom = '15px';
    description.style.fontSize = '14px';
    description.style.color = '#555';
    correctionsFootnote.appendChild(description);
    
    const footnoteList = document.createElement('ul');
    footnoteList.id = 'corrections-list';
    footnoteList.style.paddingLeft = '20px';
    correctionsFootnote.appendChild(footnoteList);
    
    // Find a good place to insert the footnote (end of article or body)
    const articleContainers = [
      document.querySelector('article'),
      document.querySelector('.article'),
      document.querySelector('.post-content'),
      document.querySelector('.entry-content'),
      document.querySelector('.content'),
      document.querySelector('main'),
      document.querySelector('#content')
    ];
    
    let container = null;
    for (const candidate of articleContainers) {
      if (candidate) {
        container = candidate;
        break;
      }
    }
    
    if (!container) {
      container = document.body;
    }
    
    container.appendChild(correctionsFootnote);
  }
  
  // Check if we've already added this correction
  const correctionsList = document.getElementById('corrections-list');
  
  // Skip if we've already added this correction
  if (addedCorrections.has(correction.originalValue)) {
    return;
  }
  
  const correctionItem = document.createElement('li');
  correctionItem.style.margin = '12px 0';
  correctionItem.style.lineHeight = '1.6';
  correctionItem.style.fontSize = '14px';
  
  // Create a short snippet of the claim (first 50 chars)
  const shortClaim = text.length > 80 ? text.substring(0, 77) + '...' : text;
  
  // Create the HTML for the correction with enhanced source information
  let correctionHTML = `
    <div style="margin-bottom: 8px;">
      <span style="font-weight: bold;">Claim:</span> "${shortClaim}"
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 6px;">
      <span style="text-decoration: line-through; color: #f44336; margin-right: 8px;">${correction.originalValue}</span>
      <span style="color: #757575; margin-right: 8px;">→</span>
      <span style="font-weight: bold; color: #4CAF50;">${correction.correctedValue}</span>
    </div>
  `;
  
  if (sourceURL && evidenceText) {
    correctionHTML += `
      <div style="margin-top: 6px; font-size: 13px;">
        <span style="color: #555; font-weight: bold;">Source:</span> 
        <span style="color: #333;">${evidenceText}</span><br>
        <a href="${sourceURL}" target="_blank" style="color: #1976D2; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 4px; border-bottom: 1px solid #1976D2;">View Source Document</a>
      </div>
    `;
  }
  
  correctionItem.innerHTML = correctionHTML;
  correctionsList.appendChild(correctionItem);
} 