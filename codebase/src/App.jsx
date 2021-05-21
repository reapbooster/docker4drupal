import React, { useState, useEffect } from 'react';
import JsonQuery from 'json-query';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import {exportTableToCSV} from './CSVExport';

function App() {

   const [fetchRan, setFetchRan] = useState(false);
   const [fetchedData, setFetchedData] = useState(null);
   const [fetchedDataCerts, setFetchedDataCerts] = useState(null);
   const [fetchedDataLocations, setFetchedDataLocations] = useState(null);

   const [filterCert, setFilterCert] = useState(null);
   const [filterLocation, setFilterLocation] = useState(null);
   const [filterStaff, setFilterStaff] = useState(null);

   let timeZoneString = 'T00:00:00.000-08:00';
   const [minDate, setMinDate] = useState(new Date('2021-01-01' + timeZoneString));
   const [maxDate, setMaxDate] = useState(new Date());

   useEffect(() => {
      if (!!fetchedData && !!fetchedDataCerts && !!fetchedDataLocations) {
         document.querySelectorAll(".row-grand-total-values").forEach((row) => {
   
            let grandTotalHTML = '';
            grandTotalHTML += `<td></td><td></td><td class="font-weight-bold">Totals</td>`;
   
            let totalSum = 0;
   
            fetchedDataCerts.map((cert) => {
               let cols = document.querySelectorAll("." + (`value-${cert}`).replace(/\s/g, '-'));
               // console.log(cols);
   
               let colSum = 0;
               cols.forEach((col) => {
                  colSum += Number(col.innerHTML);
               });
   
               grandTotalHTML += `<td class="font-weight-bold">${colSum}</td>`;
               totalSum += colSum;
   
               // console.log(`ColSum ${cert} ${colSum}`);
               // console.log(`Total Sum: ${totalSum}`);
            });
   
            grandTotalHTML += `<td class="font-weight-bold total">${totalSum}</td>`;
            row.innerHTML = grandTotalHTML;
   
         });
      }
   });

   // function filtersApply() {
   //    setFetchRan(false);
   //    console.log("filterCert:", filterCert, "filterLocation:", filterLocation, "filterStaff:", filterStaff);
   // };

   if (!fetchRan) {
      if (!fetchedData || !fetchRan) {
         let apiDataURL = '/api-v1/encounters?created[min]=' + minDate.toISOString().slice(0, 10)
            + '&created[max]=' + maxDate.toISOString().slice(0, 10);
         // console.log("apiDataURL: ", apiDataURL);
         fetch(apiDataURL)
            .then(res => res.json())
            .then((incoming) => {
               setFetchedData(incoming);
            });
      };

      if (!fetchedDataCerts || !fetchRan) {
         fetch('/api-v1/encounters/certs')
            .then(res => res.json())
            .then((incoming) => {
               setFetchedDataCerts(Object.keys(groupBy(incoming, 'field_certification_categories')));
            });
      };

      if (!fetchedDataLocations || !fetchRan) {
         fetch('/api-v1/encounters/locations')
            .then(res => res.json())
            .then((incoming) => {
               setFetchedDataLocations(incoming);
            });
      };

      setFetchRan(true);
   };

   if (!fetchedData || !fetchedDataCerts || !fetchedDataLocations) {
      return (
         <h1>Loading...</h1>
      );
   };

   function groupBy(data, val) {
      let group = [];
      data.map((item) => {
         if (!group[item[val]]) {
            group[item[val]] = [];
         }
         group[item[val]].push(item);
      });
      return group;
   };

   if (!!fetchedData && !!fetchedDataCerts && !!fetchedDataLocations) {

      const dates = Object.keys(groupBy(fetchedData, 'created'));

      const locations = Object.keys(groupBy(fetchedData, 'field_location'));
      let listLocationOptions = [];
      locations.forEach((location) => {
         listLocationOptions.push({ value: location, label: location });
      });

      const uids = Object.keys(groupBy(fetchedData, 'uid'));
      let listUIDsOptions = [];
      uids.forEach((uid) => {
         listUIDsOptions.push({ value: uid, label: uid });
      });

      let certs = fetchedDataCerts;
      let listCertsOptions = [];
      certs.forEach((cert) => {
         listCertsOptions.push({ value: cert, label: cert });
      });

      // console.log("dates:", dates, "locations:", locations, "uids:", uids, "certs:", certs); 

      function filter(created, location, uid, cert) {
         let queryData = JsonQuery(
            "[*created=" + created +
            " & field_location=" + location +
            " & uid=" + uid +
            " & field_certification_categories_1~/CERT:" + cert + "/]"
            , {
               data: fetchedData,
               allowRegexp: true,
            }
         );
         // console.log("fetchedData: ", fetchedData); 
         // console.log("filter(): ", queryData); 
         return queryData.value;
      };

      function valueInObjectArray(value, objects) {
         let flag = false;
         if (objects.length > 0) {
            objects.forEach((item) => {
               if (item?.value == value) {
                  flag = true;
               }
            });
         }
         if (objects.length == 0) {
            flag = true;
         }
         return flag;
      }

      const MainWrapper = styled.div`
         .table 
            th, td {
               vertical-align: middle;
               text-align: center;
               width: 5em;
            }
            .total {
               background: #ccc;
            }
            .form-group input[type="text"] {
               width: 6em;
               margin: 0 0.7em 0 0.3em;
            }
         }
      `;

      return (
         <MainWrapper>
            <form className="form-group container">
               <div className="row">
                  <div className="col-sm-6 mt-3">
                     <Select
                        isMulti
                        onChange={location => setFilterLocation(location)}
                        options={listLocationOptions}
                        placeholder="Filter by Location"
                        value={filterLocation}
                     />
                  </div>
                  <div className="col-sm-6 mt-3">
                     <Select
                        isMulti
                        onChange={staff => setFilterStaff(staff)}
                        options={listUIDsOptions}
                        placeholder="Filter by Staff"
                        value={filterStaff}
                     />
                  </div>
                  <div className="col-sm-6 mt-3">
                     <Select
                        isMulti
                        onChange={cert => setFilterCert(cert)}
                        options={listCertsOptions}
                        placeholder="Filter by Cert"
                        value={filterCert}
                     />
                  </div>
                  <div className="col-sm-6 mt-3 row mx-0 align-items-center">
                     <div>
                        From:
                        <DatePicker
                           dateFormat="yyyy-MM-dd"
                           selected={minDate}
                           // onChange={date => setMinDate(new Date(date))}
                           onChange={(date) => {
                              setMinDate(new Date(date));
                              setFetchRan(false);
                           }}
                           id="minDate"
                        />
                     </div>
                     <div>
                        To:
                        <DatePicker
                           dateFormat="yyyy-MM-dd"
                           selected={maxDate}
                           // onChange={date => setMaxDate(new Date(date))}
                           onChange={(date) => {
                              setMaxDate(new Date(date));
                              setFetchRan(false);
                           }}
                           id="maxDate"
                        />
                     </div>
                     {/* <div>
                        <button onClick={filtersApply}>Apply Filters</button>
                     </div> */}
                     <div>
                        <button onClick={exportTableToCSV}>Export</button>
                     </div>
                  </div>
               </div>
            </form>
            <table className="table table-bordered table-hover slahp-report">
               <thead>
                  <tr>
                     <th>Date</th>
                     <th>Location</th>
                     <th>Staff</th>
                     {
                        certs.map((cert) => {
                           return <th>{cert}</th>
                        })
                     }
                     <th>Daily Stats</th>
                  </tr>
               </thead>
               <tbody>
                  {
                     dates.map((date) => {
                        return (
                           locations.map((location) => {
                              if (!!filterLocation) {
                                 if (!valueInObjectArray(location, filterLocation)) {
                                    return '';
                                 }
                              }
                              return (
                                 uids.map((staff) => {
                                    if (!!filterStaff) {
                                       if (!valueInObjectArray(staff, filterStaff)) {
                                          return '';
                                       }
                                    }
                                    let sum = 0;
                                    let htmlRow = (
                                       <tr>
                                          <td className={`value-date`}>{date}</td>
                                          <td className={`value-location`}>{location}</td>
                                          <td className={`value-staff`}>{staff}</td>
                                          {
                                             certs.map((cert) => {
                                                if (!!filterCert) {
                                                   if (!valueInObjectArray(cert, filterCert)) {
                                                      return <td></td>;
                                                   }
                                                }
                                                let data = filter(date, location, staff, cert);
                                                sum += data.length;
                                                // console.log("date:", date, "staff:", staff, "certs:", cert, "data: ", data);
                                                return (
                                                   <td className={(`value-${cert}`).replace(/\s/g, "-")}>{data.length > 0 ? data.length : '0'}</td>
                                                );
                                             })
                                          }
                                          <td className="value-sum font-weight-bold">{sum}</td>
                                       </tr>
                                    );
                                    if (sum == 0) {
                                       return '';
                                    }
                                    if (sum > 0) {
                                       return htmlRow;
                                    }
                                 })
                              );
                           })
                        );
                     })
                  }
                  <tr className="row-grand-total-values"></tr>
               </tbody>
            </table>
         </MainWrapper>
      );
   }
};

export default App;