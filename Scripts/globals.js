// Cache DOM objects
const globals = {
    workspaceSelect: null,
    pagenameSelect: null,
    reportSelect: null,
    powerBiHostname: null,
    isPreviousReportRDL: null,
    reports_table: null,
    report_pages_table: null,
    reportName: null,
    pltWorkspaceSelect: null,
    pltReportSelect: null,
    table_body: null,
    statusnameSelect: null,
    pltAppMode: "AppOwnsData"     // Either UserOwnsData or AppOwnsData
}

// Cache logged in user's info
const loggedInUser = {
    accessToken: undefined
};

$(function() {
    globals.workspaceSelect = $("#workspace-select");
    globals.pagenameSelect = $("#page-select");
    globals.statusnameSelect = $("#status-select");
    globals.reportSelect = $("#report-select");
    globals.reports_table = $("#reports_table");
    globals.report_pages_table = $("#report_pages_table");
    globals.reportName = $(".reportName");
    globals.pltWorkspaceSelect = $("#plt_workspace-select");
    globals.pltReportSelect = $('#plt_report-select');
    globals.table_body = $('.table_body');

    // Set default state of isPreviousReportRDL flag
    globals.isPreviousReportRDL = false;
});