'use strict';
const _ = require('underscore');

module.exports = function(Cardetails) {

    Cardetails.registerCar = function (registrationNo, color, makeOfCar, modelOfCar, appUserId, callback) {
        const promise = new Promise(function (resolve, reject) {
          let carInformation, parkingInformation;
          color = color.toLowerCase();
          Cardetails.findOne({
            where: {
              registrationNo: registrationNo,
              isActive: true
            }
          })
            .then(function (carDetails) {
              if(carDetails) {
                  return resolve({success: false, message: 'car is already parked'});
              }
              return Cardetails.create({
                registrationNo: registrationNo,
                color: color,
                modelOfCar: modelOfCar,
                makeOfCar: makeOfCar,
                isActive: true,
                parkingDetailsId: null,
                parkingTime: new Date(),
                unparkingTime: null
            });
            })
            .then(function(carDetails){
              carInformation = carDetails;
              // console.log('carDetails', JSON.stringify(carDetails, null, 2));

              return Cardetails.app.models.floorDetails.check(appUserId, carDetails.id);
            })
            .then(function (carDetails) {
              if(!carDetails) {
                return resolve({sucess: true, message: 'Some error occured'});
              } else if(carDetails.success === false) {
                return resolve({success: false, message: 'Some error occured', data: carDetails});
              }
              // console.log('above save', carDetails);
              parkingInformation = carDetails.data;
              carInformation.parkingDetailsId = carDetails.data.id;
              return carInformation.save();
            })
            .then((data)=>{
              if(!data) {
                return resolve({success: false, message: 'Some error occured in saving parking info in car details table'});
              }
              let ticketDetails = {
                registrationNo: data.registrationNo,
                color: data.color,
                modelOfCar: data.modelOfCar,
                makeOfCar: data.makeOfCar,
                slotNumber: parkingInformation.slotNumber,
                floorNumber: parkingInformation.floorNumber,
                parkingTime: data.parkingTime
              }
              return resolve({success: true, message: 'Car successfully parked', data: ticketDetails});
            })
            .catch(function (err) {
              return reject(err);
            });
        });
    
        if (callback !== null && typeof callback === 'function') {
          promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
        } else {
          return promise;
        }
      };
    
      Cardetails.remoteMethod('registerCar', {
        accepts: [
          {
            arg: 'registrationNo',
            type: 'string',
            required: true,
            http: {
              source: 'query'
            }
          },
          {
            arg: 'color',
            type: 'string',
            required: true,
            http: {
              source: 'query'
            }
          },
          {
            arg: 'makeOfCar',
            type: 'string',
            required: true,
            http: {
              source: 'query'
            }
          },
          {
            arg: 'modelOfCar',
            type: 'string',
            required: true,
            http: {
              source: 'query'
            }
          },
          {
            arg: 'appUserId',
            type: 'string',
            required: true,
            http: {
              source: 'query'
            }
          }
        ],
        returns: {
          arg: 'data',
          type: 'object',
          root: true
        },
        http: {
          path: '/registercar',
          verb: 'POST'
        },
        description: 'API to register car details'
      });


      Cardetails.unparkCar = function (registrationNo, callback) {
        const promise = new Promise(function (resolve, reject) {
          let carInformation, parkingInformation;
          Cardetails.findOne({
            where: {
              registrationNo: registrationNo,
              isActive: true
            }
          })
            .then(function (carDetails) {
              carInformation = carDetails;
              carDetails.isActive = false;
              carDetails.unparkingTime = new Date();
              return carDetails.save();
            })
            .then(function() {
              return Cardetails.app.models.parkingDetails.unpark(carInformation.id);
            })
            .then(function (parkingInformation) {
              return resolve({success: true, message: 'Car unparked successfully', data: parkingInformation});
            })
            .catch(function (err) {
              return reject(err);
            });
        });
    
        if (callback !== null && typeof callback === 'function') {
          promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
        } else {
          return promise;
        }
      };
    
      Cardetails.remoteMethod('unparkCar', {
        accepts: [
          {
            arg: 'registrationNo',
            type: 'string',
            required: true,
            http: {
              source: 'form'
            }
          }
        ],
        returns: {
          arg: 'data',
          type: 'object',
          root: true
        },
        http: {
          path: '/unparkcar',
          verb: 'POST'
        },
        description: 'API to unpark car'
      });

      Cardetails.fetchAllCarsOfAParticularColor = function (color, roleOfLoggedInUser, callback) {
        const promise = new Promise(function (resolve, reject) {

          if(roleOfLoggedInUser !== 'ADMIN') {
            return resolve({success: false, message: 'Not authorized'});
          } 

          color = color.toLowerCase();
          let carInformation;
          Cardetails.find({
            where: {
              color: color,
              isActive: true
            }
          })
            .then(function (carDetails) {
              carInformation = _.pluck(carDetails, 'registrationNumber');
              return resolve({success: true, message: 'Done', data: carInformation});
            })
            .catch(function (err) {
              return reject(err);
            });
        });
    
        if (callback !== null && typeof callback === 'function') {
          promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
        } else {
          return promise;
        }
      };
    
      Cardetails.remoteMethod('fetchAllCarsOfAParticularColor', {
        accepts: [
          {
            arg: 'color',
            type: 'string',
            required: true,
            http: {
              source: 'form'
            }
          },
          {
            arg: 'roleOfLoggedInUser',
            type: 'string',
            required: false,
            http: {
              source: 'form'
            }
          }
        ],
        returns: {
          arg: 'data',
          type: 'object',
          root: true
        },
        http: {
          path: '/fetchallcarsofaparticularcolor',
          verb: 'POST'
        },
        description: 'API to fetch all cars of a particular color'
      });

      Cardetails.fetchSlotNumbers = function (registrationNumber, color, roleOfLoggedInUser, callback) {
        const promise = new Promise(function (resolve, reject) {
          if(roleOfLoggedInUser !== 'ADMIN') {
            return resolve({success: false, message: 'Not authorized'});
          } 
          color = color.toLowerCase();

          let promise, slotNumber; 
          if(registrationNumber && color === null) {
            promise = Cardetails.findOne({
              where: {
                registrationNumber: registrationNumber,
                isActive: true
              }
            })
            .then(carData => {
              return Cardetails.app.models.parkingDetails.findOne({
                where: {
                  carDetailId: carData.id,
                  isActive: true
                }
              });
            })
            .then(parkingData => {
              slotNumber = parkingData.slotNumber;
              return Promise.resolve();
            }) 
          } else if(color && registrationNumber === null) {
            promise = Cardetails.find({
              where: {
                color: color
              }
            })
            .then(carData => {
              let carDetailIds = _.pluck(carData, 'id');
              return Cardetails.app.models.parkingDetails.find({
                where: {
                  carDetailId: {
                    inq: carDetailIds
                  }
                }
              });
            })
            .then(parkingData => {
              slotNumber = _.pluck(parkingData, 'slotNumber');
              return Promise.resolve();
            })
          }

          promise
          .then(data => {
            return resolve({sucess: true, message: 'slots fetched successfully', data: slotNumber});
          })
            .catch(function (err) {
              return reject(err);
            });
        });
    
        if (callback !== null && typeof callback === 'function') {
          promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
        } else {
          return promise;
        }
      };
    
      Cardetails.remoteMethod('fetchSlotNumbers', {
        accepts: [
          {
            arg: 'registrationNumber',
            type: 'string',
            required: false,
            http: {
              source: 'form'
            }
          },
          {
            arg: 'color',
            type: 'string',
            required: false,
            http: {
              source: 'form'
            }
          },
          {
            arg: 'roleOfLoggedInUser',
            type: 'string',
            required: false,
            http: {
              source: 'form'
            }
          }
        ],
        returns: {
          arg: 'data',
          type: 'object',
          root: true
        },
        http: {
          path: '/fetchslotnumbers',
          verb: 'POST'
        },
        description: 'API to fetch all slot numbers of parked car'
      });

      Cardetails.carsParkedBy = function (registrationNumber, callback) {
        const promise = new Promise(function (resolve, reject) {

          let promise, slotNumber; 
          Cardetails.findOne({
            where: {
              registrationNumber: registrationNumber,
              isActive: true
            }
          })
          .then(carData => {
            return Cardetails.app.models.parkingDetails.find({
              where: {
                carDetailId: carData.id
              }
            });
          })
          .then(parkingData=>{
            let slotNumber = parkingData.slotNumber;
            let floorNumber = parkingData.floorNumber;

            let slotNumbers = [];
            let i = 4;
            while(i >= 0) {
              let num = i > 2 ? slotNumber - 1 : slotNumber + 1;
              slotNumbers.push(num);
            }
            return Cardetails.app.models.parkingDetails.find({
              where: {
                floorNumber: floorNumber,
                slotNumber : {
                  inq: slotNumbers
                }
              },
              include: [{
                relation: 'carDetails'
              }]
            })
          })
          .then(data=>{
            let carsParkedNearBy = [];
            _.each(data, item=>{
            let tempObj = {};

              tempObj['registrationNumber'] = item.Cardetails() ? item.Cardetails().registrationNumber: null;
              tempObj['color'] = item.Cardetails() ? item.carDetails().color : null;
              tempObj['slotNumber'] = item.slotNumber;
              tempObj['floorNumber'] = item.floorNumber;

              carsParkedNearBy.push(tempObj);
            });
            return resolve({sucess: true, message: 'Done', data: carsParkedNearBy});
          })
            .catch(function (err) {
              return reject(err);
            });
        });
    
        if (callback !== null && typeof callback === 'function') {
          promise.then(function (data) { return callback(null, data); }).catch(function (err) { return callback(err); });
        } else {
          return promise;
        }
      };
    
      Cardetails.remoteMethod('carsParkedBy', {
        accepts: [
          {
            arg: 'registrationNumber',
            type: 'string',
            required: false,
            http: {
              source: 'form'
            }
          }
        ],
        returns: {
          arg: 'data',
          type: 'object',
          root: true
        },
        http: {
          path: '/carsparkedby',
          verb: 'POST'
        },
        description: 'API to fetch details of cars parked nearby'
      });
};
