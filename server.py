import uvicorn
from mcp.server.fastmcp import FastMCP

import httpx
from xml.etree import ElementTree as ET

# --- MCP Server Setup ---
# Create an MCP server
mcp = FastMCP("Tally MCP Server", version="1.0.0")

# --- Tally Connection Details ---
TALLY_URL = "http://localhost:9000"

# --- Tally Tool Implementations ---

@mcp.tool()
async def get_day_book(date: str) -> str:
    """
    Retrieves the daybook from Tally for a specific date.
    Args:
        date: The date for the daybook in DD-MM-YYYY format.
    """
    xml_request = f"""
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>DayBook</REPORTNAME>
                    <STATICVARIABLES>
                        <SVFROMDATE>{date}</SVFROMDATE>
                        <SVTODATE>{date}</SVTODATE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(TALLY_URL, content=xml_request)

    # Basic XML parsing and formatting
    # (A more robust parser would be used in a production environment)
    try:
        root = ET.fromstring(response.content)
        vouchers = root.findall('.//VOUCHER')
        if not vouchers:
            return "No entries found in the daybook for this date."

        daybook_report = "Daybook for " + date + ":\n\n"
        for voucher in vouchers:
            voucher_type = voucher.find('VOUCHERTYPENAME').text
            voucher_number = voucher.find('VOUCHERNUMBER').text
            party_ledger = voucher.find('PARTYLEDGERNAME').text
            amount = voucher.find('AMOUNT').text
            daybook_report += f"- {voucher_type} ({voucher_number}): {party_ledger}, Amount: {amount}\n"
        return daybook_report
    except Exception as e:
        return f"Error parsing Tally response: {e}"


@mcp.tool()
async def get_ledger_vouchers(ledger_name: str, from_date: str, to_date: str) -> str:
    """
    Retrieves all vouchers for a specific ledger within a date range.
    Args:
        ledger_name: The name of the ledger.
        from_date: The start date in DD-MM-YYYY format.
        to_date: The end date in DD-MM-YYYY format.
    """
    xml_request = f"""
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Ledger Vouchers</REPORTNAME>
                    <STATICVARIABLES>
                        <LEDGERNAME>{ledger_name}</LEDGERNAME>
                        <SVFROMDATE>{from_date}</SVFROMDATE>
                        <SVTODATE>{to_date}</SVTODATE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(TALLY_URL, content=xml_request)

    try:
        root = ET.fromstring(response.content)
        vouchers = root.findall('.//VOUCHER')
        if not vouchers:
            return f"No vouchers found for ledger '{ledger_name}' in this period."

        ledger_report = f"Vouchers for {ledger_name} from {from_date} to {to_date}:\n\n"
        for voucher in vouchers:
            voucher_type = voucher.find('VOUCHERTYPENAME').text
            voucher_number = voucher.find('VOUCHERNUMBER').text
            amount = voucher.find('AMOUNT').text
            ledger_report += f"- {voucher_type} ({voucher_number}), Amount: {amount}\n"
        return ledger_report
    except Exception as e:
        return f"Error parsing Tally response: {e}"


@mcp.tool()
async def get_all_ledgers() -> str:
    """
    Retrieves a list of all ledger accounts from Tally.
    """
    xml_request = """
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Accounts</REPORTNAME>
                    <STATICVARIABLES>
                        <ACCOUNTTYPE>All Ledger Masters</ACCOUNTTYPE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(TALLY_URL, content=xml_request)

    try:
        root = ET.fromstring(response.content)
        ledgers = root.findall('.//LEDGER')
        if not ledgers:
            return "No ledgers found."

        ledger_list = "List of all ledgers:\n\n"
        for ledger in ledgers:
            ledger_list += f"- {ledger.get('NAME')}\n"
        return ledger_list
    except Exception as e:
        return f"Error parsing Tally response: {e}"