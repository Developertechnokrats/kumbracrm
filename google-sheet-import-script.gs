/**
 * Google Apps Script for Importing IPO Leads to Kumbra CRM
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet with the IPO leads
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Update the CONFIG section below with your API endpoint and secret
 * 5. Save the script (Ctrl+S or Cmd+S)
 * 6. Add a custom menu: Reload the sheet, you'll see "CRM Import" in the menu bar
 * 7. Run "Import New Leads" from the CRM Import menu
 */

// ========== CONFIGURATION ==========
const CONFIG = {
  // Your deployed CRM API endpoint
  API_ENDPOINT: 'https://crmadhdd.netlify.app/api/google-sheet/import-lead',

  // The secret key from your .env file (GOOGLE_SHEET_IMPORT_SECRET)
  API_SECRET: 'kumbra-ipo-leads-2025-secure',

  // Sheet name (usually "Sheet1" or similar)
  SHEET_NAME: 'PRE',

  // Column indices (1-based)
  COLUMNS: {
    SUBMITTED_AT: 1,
    CAMPAIGN: 2,
    FIRST_NAME: 3,
    LAST_NAME: 4,
    PHONE: 5,
    EMAIL: 6,
    COUNTRY: 7,
    OCCUPATION: 8,
    AGE_GROUP: 9,
    INVESTMENT_BUDGET: 10,
    INVESTMENT_READINESS: 11,
    INVESTMENT_TERM: 12,
    RISK_TOLERANCE: 13,
    HAS_INVESTED_BEFORE: 14,
    PREVIOUS_INVESTMENTS: 15,
    IMPORTED_TO_CRM: 16
  }
};

/**
 * Creates a custom menu in Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('CRM Import')
    .addItem('Import New Leads', 'importNewLeads')
    .addItem('Import Selected Row', 'importSelectedRow')
    .addItem('Test Connection', 'testConnection')
    .addToUi();
}

/**
 * Tests the API connection
 */
function testConnection() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Use POST with a test payload (include apiSecret in body)
    const testPayload = {
      test: true,
      apiSecret: CONFIG.API_SECRET,
      firstName: 'Test',
      lastName: 'Connection',
      email: 'test@connection.com'
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(testPayload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode === 401) {
      let errorDetails = 'Authentication failed.\n\n';
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.debug) {
          errorDetails += 'Debug Info:\n';
          errorDetails += '- Issue: ' + jsonResponse.debug.issue + '\n';
          if (jsonResponse.debug.receivedLength !== undefined) {
            errorDetails += '- Received length: ' + jsonResponse.debug.receivedLength + '\n';
            errorDetails += '- Expected length: ' + jsonResponse.debug.expectedLength + '\n';
            errorDetails += '- Received preview: ' + jsonResponse.debug.receivedPreview + '\n';
            errorDetails += '- Expected preview: ' + jsonResponse.debug.expectedPreview + '\n';
          }
          errorDetails += '- Hint: ' + jsonResponse.debug.hint;
        }
      } catch (e) {
        errorDetails += responseText;
      }
      ui.alert('Connection Failed', errorDetails, ui.ButtonSet.OK);
    } else if (statusCode === 500) {
      ui.alert('Server Error', 'Server configuration issue.\n\nResponse: ' + responseText + '\n\nMake sure GOOGLE_SHEET_IMPORT_SECRET is added to Netlify environment variables.', ui.ButtonSet.OK);
    } else if (statusCode >= 200 && statusCode < 300) {
      ui.alert('Connection Success', 'API connection successful!\n\nResponse: ' + responseText, ui.ButtonSet.OK);
    } else {
      ui.alert('Connection Warning', 'Received status code: ' + statusCode + '\n\nResponse: ' + responseText, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('Connection Error', 'Failed to connect to API:\n\n' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Imports all rows where ImportedToCRM is blank
 */
function importNewLeads() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    ui.alert('Error', 'Sheet "' + CONFIG.SHEET_NAME + '" not found. Update SHEET_NAME in the script.', ui.ButtonSet.OK);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert('No Data', 'No leads found in the sheet.', ui.ButtonSet.OK);
    return;
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 16);
  const data = dataRange.getValues();

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    const importedFlag = row[CONFIG.COLUMNS.IMPORTED_TO_CRM - 1];
    if (importedFlag) {
      skipped++;
      continue;
    }

    const email = row[CONFIG.COLUMNS.EMAIL - 1];
    if (!email) {
      skipped++;
      continue;
    }

    try {
      const result = importLead(row, rowNumber);

      if (result.status === 'created' || result.status === 'duplicate') {
        sheet.getRange(rowNumber, CONFIG.COLUMNS.IMPORTED_TO_CRM).setValue('Yes');
        imported++;
      } else if (result.status === 'error') {
        errors++;
        errorMessages.push('Row ' + rowNumber + ': ' + result.message);
      }

      Utilities.sleep(500);

    } catch (error) {
      errors++;
      errorMessages.push('Row ' + rowNumber + ': ' + error.toString());
    }
  }

  let message = 'Import Complete!\n\n';
  message += 'Imported: ' + imported + '\n';
  message += 'Skipped: ' + skipped + '\n';
  message += 'Errors: ' + errors;

  if (errorMessages.length > 0 && errorMessages.length <= 5) {
    message += '\n\nErrors:\n' + errorMessages.join('\n');
  } else if (errorMessages.length > 5) {
    message += '\n\nShowing first 5 errors:\n' + errorMessages.slice(0, 5).join('\n');
  }

  ui.alert('Import Results', message, ui.ButtonSet.OK);
}

/**
 * Imports the currently selected row
 */
function importSelectedRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const rowNumber = activeRange.getRow();

  if (rowNumber < 2) {
    ui.alert('Error', 'Please select a data row (not the header).', ui.ButtonSet.OK);
    return;
  }

  const row = sheet.getRange(rowNumber, 1, 1, 16).getValues()[0];

  try {
    const result = importLead(row, rowNumber);

    if (result.status === 'created') {
      sheet.getRange(rowNumber, CONFIG.COLUMNS.IMPORTED_TO_CRM).setValue('Yes');
      ui.alert('Success', 'Lead created successfully!\n\nLead ID: ' + result.leadId, ui.ButtonSet.OK);
    } else if (result.status === 'duplicate') {
      sheet.getRange(rowNumber, CONFIG.COLUMNS.IMPORTED_TO_CRM).setValue('Yes');
      ui.alert('Duplicate', 'This lead already exists in the CRM.\n\nLead ID: ' + result.leadId, ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Failed to import lead:\n\n' + result.message, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('Error', 'Failed to import lead:\n\n' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Imports a single lead to the CRM
 */
function importLead(row, rowNumber) {
  const payload = {
    apiSecret: CONFIG.API_SECRET,
    submittedAt: formatDate(row[CONFIG.COLUMNS.SUBMITTED_AT - 1]),
    campaign: row[CONFIG.COLUMNS.CAMPAIGN - 1] || null,
    firstName: row[CONFIG.COLUMNS.FIRST_NAME - 1] || '',
    lastName: row[CONFIG.COLUMNS.LAST_NAME - 1] || '',
    phone: row[CONFIG.COLUMNS.PHONE - 1] || null,
    email: row[CONFIG.COLUMNS.EMAIL - 1] || '',
    country: row[CONFIG.COLUMNS.COUNTRY - 1] || null,
    occupation: row[CONFIG.COLUMNS.OCCUPATION - 1] || null,
    ageGroup: row[CONFIG.COLUMNS.AGE_GROUP - 1] || null,
    investmentBudget: row[CONFIG.COLUMNS.INVESTMENT_BUDGET - 1] || null,
    investmentReadiness: row[CONFIG.COLUMNS.INVESTMENT_READINESS - 1] || null,
    investmentTerm: row[CONFIG.COLUMNS.INVESTMENT_TERM - 1] || null,
    riskTolerance: row[CONFIG.COLUMNS.RISK_TOLERANCE - 1] || null,
    hasInvestedBefore: row[CONFIG.COLUMNS.HAS_INVESTED_BEFORE - 1] || null,
    previousInvestments: row[CONFIG.COLUMNS.PREVIOUS_INVESTMENTS - 1] || null,
    sourceRowIdentifier: 'Row ' + rowNumber
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode >= 200 && statusCode < 300) {
    return JSON.parse(responseText);
  } else {
    throw new Error('HTTP ' + statusCode + ': ' + responseText);
  }
}

/**
 * Formats a date for the API
 */
function formatDate(value) {
  if (!value) return null;

  try {
    if (value instanceof Date) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    }

    const str = value.toString().trim();
    if (!str) return null;

    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return null;

    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    return null;
  }
}
