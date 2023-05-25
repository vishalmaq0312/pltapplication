/// <summary>
/// This file is used to handle different events like onclick, worspace select, save button which is listed below::
/// If User click on Save button in Add Reports section
/// If User click on Expand/Compress button in Add Reports section
/// If user would select from Workspace dropdown to filter PLTs
/// If user would select from PageName dropdown to filter PLTs
/// Opens profile model on clicking the user profile
/// Function to hit the Log Out controller to log the out
/// Refresh the access token functionality.
/// </summary>


function initializeEventHandlers() {
    
    // Workspace select event
    globals.workspaceSelect.on("change", function () {
        let getSelectParams = {
            workspaceId: this.value,
            workspaceName: $('#workspace-select option:selected').text()
        };
        getReports(getSelectParams);

        let embedSelectedParam = {
            SelectedWorkspaceName: getSelectParams.workspaceId
        }

        console.log(globals.pltAppMode);
        if (globals.pltAppMode == "AppOwnsData") {
            $.ajax({
                url: "/EmbedToken/EmbedTokenSave",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(embedSelectedParam),
                success: function (response) {
                    console.log("Saved the embed token in database");
                },
            });
        }
    });

    // If User click on Save button in Add Reports section
    globals.reports_table.on("click", "td:last-child", function () {
        console.log(this)
        var currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        var loadTestingCount = parseInt($(this).siblings()[2].children[2].value);
      //  console.log($(this).siblings()[2].children[1].id);
        if (loadTestingCount > 100) {
            $(this).siblings()[2].children[0].style.display = "block";
            $(this).siblings()[2].children[2].style = "border: 0.75px solid #D20000";
            $(this).siblings()[2].children[2].id = "icon";
            $(this).siblings()[2].children[2].className = "ibox";
            return;
        }
        else if (loadTestingCount <= 0) {
            $(this).siblings()[2].children[1].style.display = "block";
            $(this).siblings()[2].children[2].style = "border: 0.75px solid #D20000";
            $(this).siblings()[2].children[2].id = "icon";
            $(this).siblings()[2].children[2].className = "ibox";
            return;
        }
        else {
            $(this).siblings()[2].children[0].style.display = "none";
            $(this).siblings()[2].children[1].style.display = "none";
            $(this).siblings()[2].children[2].style = "border: 0.75px solid #E7E7E7";
            $(this).siblings()[2].children[2].style.background = "#ffffff";
        }

        var self = $(this).children("button");
        var row = $(this).parent();
       
            //Show spinner in place of Save icon till data gets stored
            this.children[0].src = '../Content/img/Load.svg';

            //If click on Page's Save button
            if (this.id != '') {
                let arr = this.id.split('/');
                let embedParam = {
                    workspaceId: arr[0],
                    reportId: arr[1],
                    pageId: arr[2],
                    workspaceName: arr[3],
                    reportName: arr[4],
                    pageName: arr[5],
                    loadTestingCount,
                    currentDate
                }
                $.ajax({
                    url: "/Report/PostSinglePageDetails",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify(embedParam),
                    success: function (response) {
                        $('.postSaveMessageText').html(response.responseText);
                        $('.postSaveMessage').show();
                        self.html("<span>Trigger PLT</span>");
                        row.addClass('row-style');
                        setTimeout(() => {
                            $('.postSaveMessage').hide(200);
                            row.removeClass('row-style');
                        }, 5000);
                    },
                    error: function (err) {
                        console.log(err);
                        $('.postSaveMessageText').html("Some error occured. Please refresh the page and try again.");
                        $('.postSaveMessage').show();
                        self.html("<span>Trigger PLT</span>");
                    }
                });
            } else { //If click on Report's Save button
                let arr = this.parentElement.children[0].id.split('/');
                let getSelectParams = {
                    workspaceId: arr[0],
                    reportId: arr[1],
                    workspaceName: arr[2],
                    reportName: arr[3],
                    saveInDb: true,
                    el: this,
                    loadTestingCount,
                    currentDate
                }
                getReportPages(getSelectParams);
            }
        });
 
    // If User click on Expand/Compress button in Add Reports section
    globals.reports_table.on("click", "td:first-child", function () {
        let arr = this.id.split('/');
        if (this.children[0].className == 'expanded') {
            this.children[0].className = 'compressed';
            this.children[0].src = '../Content/img/Arrow 1.svg';
            $(this).closest('.report').nextUntil('.report').hide();
            return;
        }
        
        this.children[0].className = 'expanded'
        this.children[0].src = '../Content/img/Arrow 2.svg';

        //Check if report pages are already loaded, if yes then show instead of fetching it from DB again
        var siblingTrNode = this.parentNode.nextSibling;
        if (siblingTrNode && siblingTrNode.className == 'pages') {
            while (siblingTrNode.className == 'pages') {
                siblingTrNode.style.display = 'revert';
                siblingTrNode = siblingTrNode.nextSibling;
            }
            return false;
        }
        //Else fetch from DB and show
        let getSelectParams = {
            workspaceId: arr[0],
            reportId: arr[1],
            workspaceName: arr[2],
            reportName: arr[3],
            saveInDb: false,
            el: this
        }
        getReportPages(getSelectParams);
    });

    //Triggered when selecting from Workspace dropdown to filter PLTs
    globals.pltWorkspaceSelect.on("change", function () {
        //globals.reportSelect.removeAttr('disabled');
        const reports = new Set();
        const pages = new Set();
        const status = new Set();
        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();
        $('.reportName_table tr').each(function () {
            if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {  
                        status.add($(this).attr('status-name'));
                    }
                }
                if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        pages.add($(this).attr('page-name'));
                    }
                }
                if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        reports.add($(this).attr('report-name'));
                    }
                }
                if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                        if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                            $(this).show();
                        }
                    }
                }
                
            }
            else {
                $(this).hide();
            }
        });
        $('#report-select option').each(function () {
            if (reports.has(this.text) || this.value === '') {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
       
        $('#page-select option').each(function () {
            if (pages.has(this.text) || this.value === '') {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        $('#status-select option').each(function () {
            if (status.has(this.text) || this.value === '') {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    //Triggered when selecting from Report dropdown to filter PLTs
    globals.reportSelect.on("change", function () {
        const workspaces = new Set();
        const pages = new Set();
        const status = new Set();
        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();
        $('.reportName_table tr').each(function () {
            if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        workspaces.add($(this).attr('workspace-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                        status.add($(this).attr('status-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        pages.add($(this).attr('page-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                        if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                            $(this).show();
                        }
                    }
                }
            }
            else {
                $(this).hide();
            }

        });
        $('#plt_workspace-select option').each(function () {
            if (workspaces.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        })
        $('#page-select option').each(function () {
            if (pages.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        })

        $('#status-select option').each(function () {
            if (status.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        })
    });

    //Triggered when selecting from PageName dropdown to filter PLTs
    globals.pagenameSelect.on("change", function () {
        const workspaces = new Set();
        const reports = new Set();
        const status = new Set();
        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();
       
       
        $('.reportName_table tr').each(function () {
            if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        workspaces.add($(this).attr('workspace-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                        status.add($(this).attr('status-name'));
                    }
                }

                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                        reports.add($(this).attr('report-name'));
                    }
                }

                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                        if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                            $(this).show();
                        }
                    }
                }
            }
            else {
                $(this).hide();
            }

        });
        $('#plt_workspace-select option').each(function () {
            if (workspaces.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });
  
        $('#report-select option').each(function () {
            if (reports.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });

        $('#status-select option').each(function () {
            if (status.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });
    });

    //Triggered when selecting from StatusName dropdown to filter PLTs
    globals.statusnameSelect.on("change", function () {
        const workspaces = new Set();
        const reports = new Set();
        const pages = new Set();
        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();


        $('.reportName_table tr').each(function () {
            if ($(this).attr('status-name') === selectedStatusName || selectedStatusName === '' || $(this).attr('status-name') == undefined) {
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                        pages.add($(this).attr('page-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                        reports.add($(this).attr('report-name'));
                    }
                }
                if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                    if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                        workspaces.add($(this).attr('workspace-name'));
                    }
                }
                if ($(this).attr('workspace-name') === selectedWorkspaceName || selectedWorkspaceName === '' || $(this).attr('workspace-name') == undefined) {
                    if ($(this).attr('report-name') === selectedReportName || selectedReportName === '' || $(this).attr('report-name') == undefined) {
                        if ($(this).attr('page-name') === selectedPageName || selectedPageName === '' || $(this).attr('page-name') == undefined) {
                            $(this).show();
                        }
                    }
                }
            }
            else {
                $(this).hide();
            }

        });
        $('#plt_workspace-select option').each(function () {
            if (workspaces.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });

        $('#report-select option').each(function () {
            if (reports.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });

        $('#page-select option').each(function () {
            if (pages.has(this.text) || this.value === '') {
                $(this).show();
            }
            else {
                $(this).hide();
            }
        });
    });

    var count = 0;
    //Opens profile model on clicking the user profile
    $('#userName').on('click', () => {
        setTimeout(function () {
            count = 0;
        }, 500);


        if ($('.user-profile').css('display') == 'none') {
            count = 1;
            $('.user-profile').show(500);
        }
        else {
            $('.user-profile').hide(500);
            count = 0;
        }
    });

    // Closed the profile model once user clicks on viewport anywhere outside the model
    $(document).on("click", (e) => {
        var container = $('.user-profile');
        console.log(!container.is(e.target));
   
        if ($('.user-profile').css('display') == 'block'  && count!=1) {
        // if the target of the click isn't the container nor a descendant of the container
        if (!container.is(e.target) && container.has(e.target).length ===0 && !$('#userName').is(e.target)) {
                container.hide(500);
            }
        }
    });

    //Function to hit the Log Out controller to log the out
    function logOutUser() {
        $.ajax({
            url: "/Token/Logout",
            type: "POST",
            success: function (response) {
                location.reload(true);
            },
            error: function (err) {
                location.reload(true);
            }
        });
    }

    // Sign the user out on clicking sign out button
    $('.signout').on("click", () => {
        logOutUser();
    });

    // On clicking the close button, close the message model which appears on saving any report/pages
    $('.embed_close-svg').on("click", () => {
        $('.postSaveMessage').hide();
        $('.inactivityModel').hide();
    })

    //Make a post request to refresh the access token
    function refreshAccessToken() {
        $.ajax({
            url: "/Token/Index",
            type: "POST",
            success: function (response) {
                console.log("Token refreshed ajax call success");
            }
        });
    };

    //Runs every 5 minutes to refresh the access token
    setInterval(() => {
        var accessToken = loggedInUser.accessToken;
        var expiryTime = JSON.parse(atob(accessToken.split(".")[1])).exp * 1000;
        var timeLeftToExpire = (expiryTime - Date.now()) / 60000;
        if (timeLeftToExpire < 15) refreshAccessToken();
    }, 300000);

    //Auto-refresh functionality
    setInterval(() => {
        console.log("auto-refreshed");
        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();
        
        var embedParam = {
            workspaceName: null,
            reportName: null,
            pageName: null,
            status: null,
            tableRefresh: true
        }
        $.ajax({
            url: globals.pltAppMode == "AppOwnsData" ? "/AppOwnsPLT/AppOwnsGetDetails" : "/UserOwnsPLT/UserOwnsPLTView",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(embedParam),
            success: function (response) {
                var a = "";
                a += ` <div id="loader-image" style="display:none">
                       <i class="fa fa-spinner fa-spin" style="font-size:60px"></i>
                        </div>
                        <table id="myTable" class="reportName_table">
                        <tr>
                            <th class="thtable">Page</th>
                            <th id="PLT_column" class="reportName_columns">PLT (secs)</th>
                            <th id="Users_column" class="reportName_columns">Users</th>
                            <th id="LastRuntime_column">Last runtime</th>
                            <th class="status_field">Status</th>
                            <th class="action_field">Action</th>
                        </tr>`;
                for (let i = 0; i < response.length; i++) {
                    let pltVal = "";
                    //Codition for PLT
                    if (response[i].PLT === 0) {
                        if (response[i].Status === "Failed" || response[i].Status === "Not started") {
                            pltVal = `<p class="failed_notStarted"> _ </p>`;
                        } else if (response[i].Status === "In progress") {
                            pltVal = '<img id="in_progress_plt" class="plt_file_svg" src="../../Content/img/Load.svg" width="30" height="30" title="PLT calculation is in progress" />';
                        }
                    } else
                    {
                        if (response[i].Status === "Failed") {
                            pltVal = `<p class="failed_notStarted"> _ </p>`;
                        } else {
                            pltVal = `<div class="numeric_data">${response[i].PLT.toFixed(2)}</div>`;
                        }
                    }

                    //condition for EndTime
                    let endTimeVal = "";
                    if (response[i].EndTime === "") {
                        if (response[i].Status === "Not started") {
                            endTimeVal = `<p id="not_started"> _ </p>`;
                        }
                        else if (response[i].Status === "In progress") {
                            endTimeVal = '<img id="in_progress" class="plt_file_svg" src = "../../Content/img/Load.svg" width = "30" height = "30" title = "PLT calculation is in progress" />';
                        }
                        else if (response[i].Status === "Failed") {
                            endTimeVal = `<p class="LRT">${new Date(response[i].CurrentDate).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true }).replace(",", "")}</p>`;
                        }
                    }
                    else {
                        endTimeVal = `<p class="LRT">${new Date(response[i].EndTime).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true }).replace(",", "")}</p>`;
                    }

                    //conditon for Status
                    let statusVal = "";
                    if (response[i].Status === "Not started") {
                        statusVal = `<div class="not-started-status">
                           <img class="status-image-section" src="../../Content/img/NotStarted-Icon.svg" />
                           <span class="status-text-section">${response[i].Status}</span>
                           </div>`
                    }
                    else if (response[i].Status === "Passed") {
                        statusVal = `<div class="completed-status">
                           <img class="status-image-section" src="../../Content/img/Completed-Icon.svg" />
                           <span class="status-text-section">${response[i].Status}</span>
                          </div>`
                    }
                    else if (response[i].Status === "Failed") {
                        statusVal = `<div class="failed-status">
                           <img class="status-image-section" src="../../Content/img/Failed-Icon.svg" />
                           <span class="status-text-section" title="${response[i].ErrorMessage}">${response[i].Status}</span>
                           </div>`
                    }
                    else if (response[i].Status == "In progress") {
                        statusVal = `<div class="in-progress-status">
                          <img class="status-image-section" src="../../Content/img/Inprogress-Icon.svg" />
                          <span class="status-text-section">${response[i].Status}</span>
                          </div>`
                    }

                    //Condition for Action
                    let action_condtion = "";
                    if (response[i].Status == "Passed" || response[i].Status == "In progress" || response[i].Status == "Not started") {
                        action_condtion = `<button id="${response[i].Id}" class="trigger_button cursor disabled"
                                style="outline:none;"
                                onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                                onmouseout="this.classList.remove('hover');" disabled>
                            <span>Reload PLT</span>
                        </button>`
                    }
                    else {
                        action_condtion = `<button id="${response[i].Id}" class="trigger_button cursor"
                                style="outline:none;"
                                onclick="this.classList.toggle('clicked');"
                                onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                                onmouseout="this.classList.remove('hover');">
                            <span>Reload PLT</span>
                        </button>`
                    }

                    let wName = response[i]["WorkspaceName"], rName = response[i]["ReportName"], pName = response[i]["PageName"], sName = response[i]["Status"];
                    var dplay = (selectedWorkspaceName === '' || selectedWorkspaceName === wName) &&
                        (selectedReportName === '' || selectedReportName === rName) &&
                        (selectedPageName === '' || selectedPageName === pName) &&
                        (selectedStatusName === '' || selectedStatusName === sName) ? '' : 'none';

                    a += `
                        <tr workspace-name="${wName}" report-name="${rName}" page-name="${pName}" status-name="${sName}" style="display: ${dplay}"> 
                        <td class="plt_table_td_firstchild">
                        <img class="plt_file_svg" src="../../Content/img/File.svg" alt="PLT File" width="30" height="30" />
                            <div class="page_hierarchy" title="${ wName} > ${rName} > ${pName}">
                            ${wName} > ${rName} > <span id="page_name_style"> ${pName}</span>
                        </td>
                        <td>
                            ${pltVal}
                        </td>
                        <td class="numeric_data">
                            ${response[i].UserLoadCount}
                        </td>
                        <td>
                            ${endTimeVal}
                        </td>
                        <td id="status_button">
                            ${statusVal}
                        </td>
                       <td id="action-btn">
                            ${action_condtion}
                    </td>
                    </tr>
                    `
                };
               a += '</table>';
                document.getElementsByClassName('embed_table_div')[0].innerHTML = a;

                // Get all buttons with class 'rowButton'
                const buttons = document.querySelectorAll('.trigger_button');

                // Add event listener to each button
                buttons.forEach((button) => {
                    button.addEventListener('click', function () {
                        // Get the parent row of the clicked button
                        const row = this;
                        console.log(this.parentNode)

                        // Get the ID of the row
                        const rowId = row.id;

                        // Do something with the row ID
                        console.log('Clicked row ID:', rowId);

                        // Send an AJAX request to update the database
                        $.ajax({
                            url: '/UserOwnsPLT/PLTRetry',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ rowId }),
                            success: function (response) {
                                // Handle the response from the server if needed
                                console.log(response);
                            },
                            error: function (error) {
                                // Handle any errors that occurred during the request
                                console.error(error);
                            }
                        });
                    });
                });

            },
            error: function (err) {
                console.log(err);
            }
        });
    }, 3000);

    $('.refreshTable').on('click', () => {

        let selectedWorkspaceName = $('#plt_workspace-select option:selected').val();
        let selectedReportName = $('#report-select option:selected').val();
        let selectedPageName = $('#page-select option:selected').val();
        let selectedStatusName = $('#status-select option:selected').val();

        var loader = document.getElementById("loader-image");
        loader.style.display = "block";

        
     
        var table = document.getElementById("myTable");
      
        table.classList.add("blur");
        
        var embedParam = {
            workspaceName: null,
            reportName: null,
            pageName: null,
            status: null,
            tableRefresh: true
        }

        console.log(embedParam, selectedStatusName, selectedPageName, selectedReportName, selectedWorkspaceName);
        $.ajax({
            url: globals.pltAppMode == "AppOwnsData" ? "/AppOwnsPLT/AppOwnsGetDetails" : "/UserOwnsPLT/UserOwnsPLTView",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(embedParam),
            success: function (response) {
                console.log("Data fetched for App owns");
                var a = "";
                a += ` <div id="loader-image" style="display:none">
                       <i class="fa fa-spinner fa-spin" style="font-size:60px"></i>
                        </div>
                        <table id="myTable" class="reportName_table">
                        <tr>
                            <th class="thtable">Page</th>
                            <th id="PLT_column" class="reportName_columns">PLT (secs)</th>
                            <th id="Users_column" class="reportName_columns">Users</th>
                            <th id="LastRuntime_column">Last runtime</th>
                            <th class="status_field">Status</th>
                            <th class="action_field">Action</th>
                        </tr>`;
                for (let i = 0; i < response.length; i++) {
                    let pltVal = "";
                    //condition for PLT
                    if (response[i].PLT === 0) {
                        if (response[i].Status === "Failed" || response[i].Status === "Not started") {
                            pltVal = `<p class="failed_notStarted"> _ </p>`;
                        } else if (response[i].Status === "In progress") {
                            pltVal = '<img id="in_progress_plt" class="plt_file_svg" src="../../Content/img/Load.svg" width="30" height="30" title="PLT calculation is in progress" />';
                        }
                    } else
                    {
                        if (response[i].Status === "Failed") {
                            pltVal = `<p class="failed_notStarted"> _ </p>`;
                        } else {
                            pltVal = `<div class="numeric_data">${response[i].PLT.toFixed(2)}</div>`;
                        }
                    }

                    //condition for EndTime
                    let endTimeVal = "";
                    if (response[i].EndTime === "") {
                        if (response[i].Status === "Not started") {
                            endTimeVal = `<p id="not_started"> _ </p>`;
                        }
                        else if (response[i].Status === "In progress") {
                            endTimeVal = '<img id="in_progress" class="plt_file_svg" src = "../../Content/img/Load.svg" width = "30" height = "30" title = "PLT calculation is in progress" />';
                        }
                        else if (response[i].Status === "Failed") {
                            endTimeVal = `<p class="LRT">${new Date(response[i].CurrentDate).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true }).replace(",", "")}</p>`;
                        }
                    }
                    else {
                        endTimeVal = `<p class="LRT">${new Date(response[i].EndTime).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true }).replace(",", "")}</p>`;
                    }

                    //conditon for Status
                    let statusVal = "";
                    if (response[i].Status === "Not started") {
                        statusVal = `<div class="not-started-status">
                           <img class="status-image-section" src="../../Content/img/NotStarted-Icon.svg" />
                           <span class="status-text-section">${response[i].Status}</span>
                           </div>`
                    }
                    else if (response[i].Status === "Passed") {
                        statusVal = `<div class="completed-status">
                           <img class="status-image-section" src="../../Content/img/Completed-Icon.svg" />
                           <span class="status-text-section">${response[i].Status}</span>
                          </div>`
                    }
                    else if (response[i].Status === "Failed") {
                        statusVal = `<div class="failed-status">
                           <img class="status-image-section" src="../../Content/img/Failed-Icon.svg" />
                           <span class="status-text-section" title="${response[i].ErrorMessage}">${response[i].Status}</span>
                           </div>`
                    }
                    else if (response[i].Status == "In progress") {
                        statusVal = `<div class="in-progress-status">
                          <img class="status-image-section" src="../../Content/img/Inprogress-Icon.svg" />
                          <span class="status-text-section">${response[i].Status}</span>
                          </div>`
                    }

                    //Condition for Action
                    let action_condtion = "";
                    if (response[i].Status == "Passed" || response[i].Status == "In progress" || response[i].Status == "Not started") {
                        action_condtion = `<button id="${response[i].Id}" class="trigger_button cursor disabled"
                                style="outline:none;"
                                onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                                onmouseout="this.classList.remove('hover');" disabled>
                            <span>Reload PLT</span>
                        </button>`
                    }
                    else {
                        action_condtion = `<button id="${response[i].Id}" class="trigger_button cursor"
                                style="outline:none;"
                                onclick="this.classList.toggle('clicked');"
                                onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                                onmouseout="this.classList.remove('hover');">
                            <span>Reload PLT</span>
                        </button>`
                    }

                    let wName = response[i]["WorkspaceName"], rName = response[i]["ReportName"], pName = response[i]["PageName"], sName = response[i]["Status"];
                    var dplay = (selectedWorkspaceName === '' || selectedWorkspaceName === wName) &&
                        (selectedReportName === '' || selectedReportName === rName) &&
                        (selectedPageName === '' || selectedPageName === pName) &&
                        (selectedStatusName === '' || selectedStatusName === sName) ? '' : 'none';

                    a += `
                        <tr workspace-name="${wName}" report-name="${rName}" page-name="${pName}" status-name="${sName}" style="display: ${dplay}"> 
                        <td class="plt_table_td_firstchild">
                        <img class="plt_file_svg" src="../../Content/img/File.svg" alt="PLT File" width="30" height="30" />
                            <div class="page_hierarchy" title="${wName} > ${rName} > ${pName}">
                            ${wName} > ${rName} > <span id="page_name_style"> ${pName}</span>
                        </td>
                        <td>
                            ${pltVal}
                        </td>
                        <td class="numeric_data">
                            ${response[i].UserLoadCount}
                        </td>
                        <td>
                            ${endTimeVal}
                        </td>
                        <td id="status_button">
                            ${statusVal}
                        </td>
                        <td id="action-btn">
                            ${action_condtion}
                    </td>
                    </tr>
                    `
                };
               a += '</table>';
               document.getElementsByClassName('embed_table_div')[0].innerHTML = a;
               loader.style.display = "none";
               table.classList.remove("blur");

                // Get all buttons with class 'rowButton'
                const buttons = document.querySelectorAll('.trigger_button');

                // Add event listener to each button
                buttons.forEach((button) => {
                    button.addEventListener('click', function () {
                        // Get the parent row of the clicked button
                        const row = this;
                        console.log(this.parentNode)

                        // Get the ID of the row
                        const rowId = row.id;

                        // Do something with the row ID
                        console.log('Clicked row ID:', rowId);

                        // Send an AJAX request to update the database
                        $.ajax({
                            url: '/UserOwnsPLT/PLTRetry',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ rowId }),
                            success: function (response) {
                                // Handle the response from the server if needed
                                console.log(response);
                            },
                            error: function (error) {
                                // Handle any errors that occurred during the request
                                console.error(error);
                            }
                        });
                    });
                });
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    $("#reset").on("click", function () {
        $(".custom_select option[selected]").prop('selected', true);
    });

    function showAllMenu() {
        var $rows = $('.custom_select option');
        $rows.show();
    }

    var clearFilter = $('#reset');
    clearFilter.click(showAllMenu);


    function showAll() {
        var $rows = $('#myTable tr');
        $rows.show();
    }

    var buttonClearFilter = $('#reset');
    buttonClearFilter.click(showAll);

}