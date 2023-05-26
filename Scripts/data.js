/// <summary>
/// This file is used to fetch the workspaces list, reports list, reportpages list, Populates select list,  Populates Reports Info into Table
/// </summary>


// Fetch workspaces list from Power BI
globals.getWorkspaces = function () {
    const componentType = "workspace";
    const componentListEndpoint = `${globals.powerBiApi}/groups`;

    // Populates workspace select list
    populateSelectList(componentType, componentListEndpoint, globals.workspaceSelect);
}

// Fetch reports list from Power BI
function getReports(getSelectParams) {
    const componentType = "report";
    const componentListEndpoint = `${globals.powerBiApi}/groups/${getSelectParams.workspaceId}/reports`;
    // Populates report select list
    populateReportsTable(componentType, componentListEndpoint, globals.reports_table, null, null, false, getSelectParams.workspaceName);
}

// Fetch reportpages list from Power BI
function getReportPages(getSelectParams) {
    const componentType = "reportpages";
    const componentListEndpoint = `${globals.powerBiApi}/groups/${getSelectParams.workspaceId}/reports/${getSelectParams.reportId}/pages`;
    // Populates report select list
    populateReportsTable(componentType, componentListEndpoint, getSelectParams.el, getSelectParams.workspaceId, getSelectParams.reportId, getSelectParams.saveInDb, getSelectParams.workspaceName, getSelectParams.reportName, getSelectParams.loadTestingCount, getSelectParams.currentDate);
}

// Populates select list
function populateSelectList(componentType, componentListEndpoint, componentContainer) {
    let componentDisplayName;

    // Set component select list display name depending on 

    switch (componentType.toLowerCase()) {
        case "workspace":
            componentDisplayName = "name";
            break;
        default:
            showError("Invalid Power BI Component");
    }

    // Fetch component list from Power BI
    $.ajax({
        type: "GET",
        url: componentListEndpoint,
        headers: {
            "Authorization": `Bearer ${loggedInUser.accessToken}`
        },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            // Sort dropdown list
            // Use ID if title property is undefined
            let sortedList = data.value.sort((a, b) => ((a[componentDisplayName] || a.id).toLowerCase() > (b[componentDisplayName] || b.id).toLowerCase()) ? 1 : -1);
            // Populate select list
            for (let i = 0; i < sortedList.length; i++) {
                // Show ID in option if title property is empty
                    componentContainer.append(
                        $("<option />")
                            .text(sortedList[i][componentDisplayName] || sortedList[i].id)
                            .val(sortedList[i].id)
                    );
            }

            if (sortedList.length >= 1) {

                // Enable tile select list
                componentContainer.removeAttr("disabled");
            }
        },
        error: function(err) {
            showError(err);
        }
    });
}

// Populates Reports Info into Table
function populateReportsTable(componentType, componentListEndpoint, componentContainer, workspaceId = null, reportId = null, saveInDb, workspaceName, reportName = null, loadTestingCount = null, currentDate = null) {
    let componentDisplayName;

    // Set component select list display name depending on embed type
    switch (componentType.toLowerCase()) {
        case "report":
            componentDisplayName = "name";
            break;
        case "reportpages":
            componentDisplayName = "displayName";
            break;
        default:
            showError("Invalid Power BI Component");
    }

    // Fetch component list from Power BI
    $.ajax({
        type: "GET",
        url: componentListEndpoint,
        headers: {
            "Authorization": `Bearer ${loggedInUser.accessToken}`
        },
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            // Sort
            // Use ID if title property is undefined
            let sortedList = data.value.sort((a, b) => ((a[componentDisplayName] || a.id).toLowerCase() > (b[componentDisplayName] || b.id).toLowerCase()) ? 1 : -1);

            // Fetch all page names for a report in one go and store in DB
            if (saveInDb) {
                let pageNamesArr = [], pageIdsArr = [];
                let embedParam = {
                    workspaceId,
                    reportId,
                    workspaceName,
                    reportName,
                    loadTestingCount,
                    currentDate
                }
                sortedList.forEach((el, idx) => {
                    pageNamesArr.push(el.displayName);
                    pageIdsArr.push(el.name);
                });
                embedParam.pageIDs = pageIdsArr;
                embedParam.pageNames = pageNamesArr;
                $.ajax({
                    url: "/Report/PostMultiplePageDetails",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify(embedParam),
                    success: function (response) {
                        $('.postSaveMessageText').html(response.responseText);
                        $('.postSaveMessage').show();
                        $(componentContainer).children("img").attr('src', '../../Content/img/Save.svg');
                        setTimeout(() => {
                            $('.postSaveMessage').hide(200);
                        }, "5000");

                        let self = $(componentContainer).children("button");
                        let row = $(componentContainer).parent();
                        self.html("<span>Trigger PLT</span>");
                        row.addClass('row-style');
                        setTimeout(() => {
                            row.removeClass('row-style');
                        }, 5000);
                    },
                    error: function (err) {
                        $('.postSaveMessageText').html("Some error occured. Please refresh the page and try again.");
                        $('.postSaveMessageText').show();
                        $(componentContainer).children("img").attr('src', '../../Content/img/Save.svg');
                    }
                });
                return false;
            } else {
                //Empty the table first (Remove the 'Please Choose any workspace from the dropdown' value)
                (componentType == "report") && $(".embed_noworkspace_message").empty() && componentContainer.empty();

                for (let i = 0; i < sortedList.length; i++) {
                    // Show ID in option if title property is empty
                    /*Trace.WriteLine(sortedList[i][componentDisplayName]);*/
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    var fragment = document.createDocumentFragment();
                    var trEl = document.createElement('tr');
                    var firstTd = document.createElement('td');
                    firstTd.setAttribute('id', `${sortedList[i].datasetWorkspaceId + '/' + sortedList[i].id + '/' + workspaceName + '/' + sortedList[i][componentDisplayName]}`);

                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    if (globals.pltAppMode == "AppOwnsData") {
                        var el = (componentType == "report") ?
                            `<tr class="report" onmouseenter="this.style.backgroundColor = '#F3F2F2';" onmouseleave="this.style.backgroundColor = '';">
                        <td id="${sortedList[i].datasetWorkspaceId + '/' + sortedList[i].id + '/' + workspaceName + '/' + sortedList[i][componentDisplayName]}">
                            <img class="compressed cursor" src="../../Content/img/Arrow 1.svg" width="30" height="30" />
                            <span class="cursor">${sortedList[i][componentDisplayName] || sortedList[i].id}</span>
                        </td>
                        <td class="report_link">
                            <a target="blank" href='/AppOwnsPLT/AppOwnsURLEmbedReport?workspace=${workspaceId}&report=${reportId}'><img class="plt_file_svg" src="../../Content/img/Report Link.svg" width="30" height="30" /></a>
                        </td>

                        <td class="load_count">
                            <div class="count_error">Maximum LT count is 35</div>
                            <div class="count_error">Minimum LT count is 1</div>
                            <input class="ibox input_box_style" type="number" value="1" style="background: #ffffff;"/>                           
                        </td>

                        <td class="embed_table_center">
                            <button class="trigger_button cursor" report-id='${sortedList[i].datasetWorkspaceId + '/' + sortedList[i].id + '/' + workspaceName + '/' + sortedList[i][componentDisplayName]}' 
                            style="outline:none;" onclick="this.classList.toggle('clicked');"
                            onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                            onmouseout="this.classList.remove('hover');">
                            <span>Trigger PLT</span>
                            </button>
                        </td>
                        </tr >` :
                            `<tr class='pages' onmouseenter="this.style.backgroundColor = '#F3F2F2';" onmouseleave="this.style.backgroundColor = '';">
                            <td class="page_hierarchy_addPLT" id="page_name_style"><span>${sortedList[i][componentDisplayName] || sortedList[i].id}</span></td>
                            <td class="report_link">
                                <a target="blank" href='/AppOwnsPLT/AppOwnsURLEmbedReport?workspace=${workspaceId}&report=${reportId}'>
                                    <img class="plt_file_svg" src="../../Content/img/Report Link.svg" width="30" height="30" />
                                </a>
                            </td>
                            <td class="load_count">
                                <div class="count_error">Maximum LT count is 35</div>
                                <div class="count_error">Minimum LT count is 1</div>
                                <input class="ibox input_box_style" type="number" value="1" style="background: #ffffff;"/>                                
                            </td>
                            <td class="embed_table_center" id="${workspaceId + '/' + reportId + '/' + sortedList[i].name + '/' + workspaceName + '/' + reportName + '/' + sortedList[i][componentDisplayName]}">
                            <button class="trigger_button cursor" report-id="${workspaceId + '/' + reportId + '/' + sortedList[i].name + '/' + workspaceName + '/' + reportName + '/' + sortedList[i][componentDisplayName]}" 
                            style="outline:none;" onclick="this.classList.toggle('clicked');"
                            onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                            onmouseout="this.classList.remove('hover');">
                            <span>Trigger PLT</span>
                            </button>
                        </td>
                        </tr>`;
                    }
                    if (globals.pltAppMode == "UserOwnsData") {
                        var el = (componentType == "report") ?
                            `<tr class="report" onmouseenter="this.style.backgroundColor = '#F3F2F2';" onmouseleave="this.style.backgroundColor = '';">
                        <td id="${sortedList[i].datasetWorkspaceId + '/' + sortedList[i].id + '/' + workspaceName + '/' + sortedList[i][componentDisplayName]}">
                            <img class="compressed cursor" src="../../Content/img/Arrow 1.svg" width="30" height="30" />
                            <span class="cursor">${sortedList[i][componentDisplayName] || sortedList[i].id}</span>
                        </td>
                        <td class="report_link">
                            <a target="blank" href='https://app.powerbi.com/groups/${sortedList[i].datasetWorkspaceId}/reports/${sortedList[i].id}/ReportSection'><img class="plt_file_svg" src="../../Content/img/Report Link.svg" width="30" height="30" /></a>
                        </td>
                        <td class="load_count">
                            <div class="count_error">Maximum LT count is 35</div>
                            <div class="count_error">Minimum LT count is 1</div>
                            <input class="ibox input_box_style" type="number" value="1" style="background: #ffffff;"/>
                        </td>
                        <td class="embed_table_center">
                            <button id="trigger_btn"  class="trigger_button cursor" report-id='${sortedList[i].datasetWorkspaceId + '/' + sortedList[i].id + '/' + workspaceName + '/' + sortedList[i][componentDisplayName]}' style="outline:none" 
                            style="outline:none;" onclick="var row = this.closest('.report');  this.classList.toggle('clicked');"
                            onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                            onmouseout="this.classList.remove('hover');">
                            <span>Trigger PLT</span>
                            </button>
                        </td>

                        </tr>` :
                            `<tr class='pages' onmouseenter="this.style.backgroundColor = '#F3F2F2';" onmouseleave="this.style.backgroundColor = '';">
                            <td class="page_hierarchy_addPLT" id="page_name_style">${sortedList[i][componentDisplayName] || sortedList[i].id}</td>
                            <td class="report_link">
                                <a target="blank" href='https://app.powerbi.com/groups/${workspaceId}/reports/${reportId}/${sortedList[i].name}'>
                                    <img class="plt_file_svg" src="../../Content/img/Report Link.svg" width="30" height="30" />
                                </a>
                            </td>
                            <td class="load_count">
                                <div class="count_error">Maximum LT count is 35</div>
                                <div class="count_error">Minimum LT count is 1</div>
                                <input class="ibox input_box_style" type="number" value="1" style="background: #ffffff;"/>
                                
                            </td>
                        <td class="embed_table_center" id="${workspaceId + '/' + reportId + '/' + sortedList[i].name + '/' + workspaceName + '/' + reportName + '/' + sortedList[i][componentDisplayName]}">
                            <button class="trigger_button cursor" report-id="${workspaceId + '/' + reportId + '/' + sortedList[i].name + '/' + workspaceName + '/' + reportName + '/' + sortedList[i][componentDisplayName]}"
                                    style="outline:none;" onclick="var row = this.closest('.report');  this.classList.toggle('clicked');"
                                    onmouseover="if (!this.classList.contains('clicked')) { this.classList.add('hover'); }"
                                    onmouseout="this.classList.remove('hover');">
                                    <span>Trigger PLT</span>
                            </button>
                        </td>


                        </tr>`;
                    }

                    (componentType == "report") ? componentContainer.append(el) : $(componentContainer).closest('tr').after(el);
                }
                if (sortedList.length == 0 && componentType == "report") {
                    componentContainer.append('<tr><td colspan="2">No Reports found. Try selecting different workspace.</td></tr>');
                }
            }
        },
        error: function (err) {
            showError(err);
        }
    });
}
