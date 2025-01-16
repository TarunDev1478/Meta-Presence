const axios2 = require("axios");
const WebSocket = require('ws'); // Ensure ws library is imported

const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:8080";

const axios = {
    post: async (...args) => {
        try {
            const res = await axios2.post(...args);
            return res;
        } catch (e) {
            return e.response;
        }
    },
    get: async (...args) => {
        try {
            const res = await axios2.get(...args);
            return res;
        } catch (e) {
            return e.response;
        }
    },
    put: async (...args) => {
        try {
            const res = await axios2.put(...args);
            return res;
        } catch (e) {
            return e.response;
        }
    },
    delete: async (...args) => {
        try {
            const res = await axios2.delete(...args);
            return res;
        } catch (e) {
            return e.response;
        }
    },
};

describe("Authentication", () => {
    test('User is able to sign up only once', async () => {
        const username = "kirat" + Math.random(); // kirat0.12331313
        const password = "123456789";
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username,
            password: password,
            type: "Admin"
        });

        expect(response.status).toBe(200);
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username,
            password: password,
            type: "Admin"
        });

        expect(updatedResponse.status).toBe(400);
    });

    test('Signup request fails if the username is empty', async () => {
        const username = `kirat-${Math.random()}`; // kirat-0.12312313
        const password = "123456789";

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            password
        });

        expect(response.status).toBe(400);
    });

    test('Signin succeeds if the username and password are correct', async () => {
        const username = `kirat-${Math.random()}`;
        const password = "123456";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "Admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
    });

    test('Signin fails if the username and password are incorrect', async () => {
        const username = `kirat-${Math.random()}`;
        const password = "123456";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            role: "Admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUsername",
            password
        });

        expect(response.status).toBe(403);
    });
});


describe("User metadata endpoint", () => {
    let token = "";
    let avatarId = ""

    beforeAll(async () => {
    //    const username = `kirat-${Math.random()}`
    //    const password = "12345678911"

    //    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
    //     username:username,
    //     password:password,
    //     type: "admin"
    //    });
       const username = "kirat" + Math.random(); // kirat0.12331313
               const password = "123456789";
               await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                   username: username,
                   password: password,
                   type: "Admin"
               });

       const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
        username:username,
        password:password,
       })

       token = response.data.token

       const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy123"
        }, {
            headers: {
                authorization: `Bearer ${token}`
            }
        })
        console.log("avatarresponse is " + avatarResponse.data.id)

        avatarId = avatarResponse.data.id;

    })

    test("User cant update their metadata with a wrong avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "123123123"
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400)
    })

    // test("User can update their metadata with the right avatar id", async () => {
    //     const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
    //         avatarId: avatarId
    //     }, {
    //         headers: {
    //             "authorization": `Bearer ${token}`
    //         }
    //     })

    //     expect(response.status).toBe(200)
    // })

    test("User can update their metadata with the right avatar id", async () => {
           console.log("avatarId in test:", avatarId);

        const response = await axios.post(
            `${BACKEND_URL}/api/v1/user/metadata`,
            { avatarId },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        console.log("Response:", response.data);
        expect(response.status).toBe(200);
    });

    test("User is not able to update their metadata if the auth header is not present", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })

        expect(response.status).toBe(403)
    })

    test("test 3", () => {
        
    })
});

describe("User avatar information", () => {
    let avatarId;
    let token;
    let userId;

    beforeAll(async () => {
       
        const username = "kirat" + Math.random();
               const password = "123456789";
               const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                   username: username,
                   password: password,
                   type: "Admin"
               });
               userId = signupResponse.data.userId
       const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
        username:username,
        password:password,
       })

       token = response.data.token
 
        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
             "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
             "name": "Timmy"
         }, {
            headers: {
                authorization: `Bearer ${token}`
            }
         })
 
         avatarId = avatarResponse.data.id;
 
    })

    test("Get back avatar information for a user", async () => {
        console.log("asking for user with id " + userId)
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);
        console.log("response was " + userId)
        console.log(JSON.stringify(response.data))
        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    })

    test("Available avatars lists the recently created avatar", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        console.log(avatarId);
        expect(response.data.avatar.length).not.toBe(0);
        const currentAvatar = response.data.avatar.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined()
    })

})

describe("Space information", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        
        const username = "kirat" + Math.random(); 
                const password = "123456789";
                const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                    username: username,
                    password: password,
                    type: "Admin"
                });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        adminToken = response.data.token
        const username1 = "kirat" + Math.random()+ "-user";
        const password1 = "12345678910";
        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username1,
            password:password1,
            type: "User"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username1,
            password:password1
        })
    
        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id
        console.log(element2Id)
        console.log(element1Id)
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
         console.log("mapResponse.status")
         console.log(mapResponse.data.id)

         mapId = mapResponse.data.id

    });

    test("User is able to create a space", async () => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimention": "100x200",
          "mapId": mapId
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })
       expect(response.status).toBe(200)
       expect(response.data.spaceId).toBeDefined()
    })

    test("User is able to create a space without mapId (empty space)", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimention": "100x200",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })
      
       expect(response.data.spaceId).toBeDefined()
    })

    test("User is not able to create a space without mapId and dimensions", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })

       expect(response.status).toBe(400)
    })

    test("User is not able to delete a space that doesnt exist", async () => {
        const response = await axios.delete(`${BACKEND_URL}/api/v1/space/randomIdDoesntExist`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

       expect(response.status).toBe(400)
    })

    test("User is able to delete a space that does exist", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimention": "100x200",
         }, {
          headers: {
              authorization: `Bearer ${userToken}`
          }
         })
        console.log(response.status)
        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        
       expect(deleteReponse.status).toBe(200)
    })

    test("User should not be able to delete a space created by another user", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimention": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        console.log(response.data.spaceId);
        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        console.log(deleteReponse.status);
       expect(deleteReponse.status).toBe(403)
    })

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0)
    })

    test("Admin has gets once space after", async () => {
        const spaceCreateReponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimention": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        // console.log('jhflksdjflksdfjlksdfj')
        console.log(spaceCreateReponse.data)
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        const filteredSpace = response.data.spaces.find(x => x.id == spaceCreateReponse.data.spaceId)
        expect(response.data.spaces.length).toBe(1)
        expect(filteredSpace).toBeDefined()

    })
})

describe("Arena endpoints", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;
    let spaceId;

    beforeAll(async () => {

                const username = "kirat" + Math.random(); 
                const password = "123456789";
                const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                    username: username,
                    password: password,
                    type: "Admin"
                });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        adminToken = response.data.token
        const username1 = "kirat" + Math.random()+ "-user";
        const password1 = "12345678910";
        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username1,
            password:password1,
            type: "User"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username1,
            password:password1
        })
    
        userToken = userSigninResponse.data.token


        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            name: "Default space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
        mapId = mapResponse.data.id
        console.log(mapResponse.data);
        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimention": "100x200",
            "mapId": mapId
        }, {headers: {
            "authorization": `Bearer ${userToken}`
        }})
        console.log(spaceResponse.data)
        spaceId = spaceResponse.data.spaceId
    });

    test("Incorrect spaceId returns a 400", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/123kasdk01`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        expect(response.status).toBe(400)
    })

    test("Correct spaceId returns all the elements", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        console.log(response.data)
        console.log(response.data.sapce.dimension)
        expect(response.data.sapce.dimension).toBe("100x200")
        expect(response.data.sapce.elements.length).toBe(3)
    })

    test("Delete endpoint is able to delete an element", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        console.log(response.data.sapce.elements[0].id )
        let res = await axios.delete(`${BACKEND_URL}/api/v1/space/ele/element`, {
            data: {id: response.data.sapce.elements[0].id},
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        console.log(res.data);

        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(newResponse.data.sapce.elements.length).toBe(2)
    })

    test("Adding an element fails if the element lies outside the dimensions", async () => {
       const newResponse = await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            "elementId": element1Id,
            "spaceId": spaceId,
            "x": 10000,
            "y": 210000
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(newResponse.status).toBe(400)
    })

    test("Adding an element works as expected", async () => {
        await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            "elementId": element1Id,
            "spaceId": spaceId,
            "x": 50,
            "y": 20
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        
        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        console.log(newResponse)
        expect(newResponse.data.sapce.elements.length).toBe(3)
    })

})

describe("Admin Endpoints", () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        
        const username = "kirat" + Math.random(); 
                        const password = "123456789";
                        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                            username: username,
                            password: password,
                            type: "Admin"
                        });
        
                adminId = signupResponse.data.userId
         
                const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
                 username,
                 password
                })
         
                adminToken = response.data.token
                const username1 = "kirat" + Math.random()+ "-user";
                const password1 = "12345678910";
                const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                    username: username1,
                    password:password1,
                    type: "User"
                });
           
                userId = userSignupResponse.data.userId
            
                const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
                    username: username1,
                    password:password1
                })
            
                userToken = userSigninResponse.data.token
    });

    test("User is not able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "test space",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/123`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(elementReponse.status).toBe(403)
        expect(mapResponse.status).toBe(403)
        expect(avatarResponse.status).toBe(403)
        expect(updateElementResponse.status).toBe(403)
    })

    test("Admin is able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "name": "Space",
            "dimensions": "100x200",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        expect(elementReponse.status).toBe(200)
        expect(mapResponse.status).toBe(200)
        expect(avatarResponse.status).toBe(200)
    })
 
    test("Admin is able to update the imageUrl for an element", async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        console.log(elementResponse.data);
        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        console.log(updateElementResponse.data)
        expect(updateElementResponse.status).toBe(200);

    })
});



describe("Websocket tests", () => {
    let adminToken;
    let adminUserId;
    let userToken;
    let adminId;
    let userId;
    let mapId;
    let element1Id;
    let element2Id;
    let spaceId;
    let ws1;
    let ws2;
    let ws1Messages = [];
    let ws2Messages = [];
    let userX;
    let userY;
    let adminX;
    let adminY;

    function waitForAndPopLatestMessage(messageArray) {
        return new Promise((resolve) => {
            if (messageArray.length > 0) {
                resolve(messageArray.shift());
            } else {
                let interval = setInterval(() => {
                    if (messageArray.length > 0) {
                        resolve(messageArray.shift());
                        clearInterval(interval);
                    }
                }, 100);
            }
        });
    }

    async function setupHTTP() {
        const username = "kirat" + Math.random();
        const password = "123456789";
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username,
            password: password,
            type: "Admin"
        });

        adminId = signupResponse.data.userId;

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        adminToken = response.data.token;
        const username1 = "kirat" + Math.random() + "-user";
        const password1 = "12345678910";
        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username1,
            password: password1,
            type: "User"
        });

        userId = userSignupResponse.data.userId;

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username1,
            password: password1
        });

        userToken = userSigninResponse.data.token;

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        element1Id = element1Response.data.id;
        element2Id = element2Response.data.id;

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "Default space",
            defaultElements: [{
                elementId: element1Id,
                x: 20,
                y: 20
            }, {
                elementId: element1Id,
                x: 18,
                y: 20
            }, {
                elementId: element2Id,
                x: 19,
                y: 20
            }]
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        mapId = mapResponse.data.id;

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test",
            dimention: "100x200",
            mapId: mapId
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        console.log(spaceResponse.status);
        spaceId = spaceResponse.data.spaceId;
    }

    async function setupWs() {
        ws1 = new WebSocket(WS_URL);

        ws1.onmessage = (event) => {
            console.log("got back data 1");
            console.log(event.data);
            try {
                ws1Messages.push(JSON.parse(event.data));
            } catch (e) {
                console.error("Failed to parse message from ws1:", e, event.data);
            }
        };
        await new Promise((r) => {
            ws1.onopen = r;
        });

        ws2 = new WebSocket(WS_URL);

        ws2.onmessage = (event) => {
            console.log("got back data 2");
            console.log(event.data);
            try {
                ws2Messages.push(JSON.parse(event.data));
            } catch (e) {
                console.error("Failed to parse message from ws2:", e, event.data);
            }
        };
        await new Promise((r) => {
            ws2.onopen = r;
        });
    }

    beforeAll(async () => {
        await setupHTTP();
        await setupWs();
    });

    test("Get back ack for joining the space", async () => {
        console.log("inside first test");
        ws1.send(JSON.stringify({
            type: "join",
            payload: {
                spaceId: spaceId,
                token: adminToken
            }
        }));
        console.log("inside first test1");
        const message1 = await waitForAndPopLatestMessage(ws1Messages);
        console.log(message1);
        console.log("inside first test2");
        ws2.send(JSON.stringify({
            type: "join",
            payload: {
                spaceId: spaceId,
                token: userToken
            }
        }));
        console.log("inside first test3");

        const message2 = await waitForAndPopLatestMessage(ws2Messages);
        const message3 = await waitForAndPopLatestMessage(ws1Messages);
        console.log(message1);
        console.log(message2)
        expect(message1.type).toBe("space-joined");
        expect(message2.type).toBe("space-joined");
        expect(message1.payload.users.length).toBe(0);
        expect(message2.payload.users.length).toBe(1);
        expect(message3.type).toBe("user-joined");
        expect(message3.payload.x).toBe(message2.payload.spawn.x);
        expect(message3.payload.y).toBe(message2.payload.spawn.y);
        expect(message3.payload.userId).toBe(userId);

        adminX = message1.payload.spawn.x;
        adminY = message1.payload.spawn.y;

        userX = message2.payload.spawn.x;
        userY = message2.payload.spawn.y;
    });

    test("User should not be able to move across the boundary of the wall", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 1000000,
                y: 10000
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    });

    test("User should not be able to move two blocks at the same time", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX + 2,
                y: adminY
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    });

    test("Admin should not be able to move into an element", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 20,
                y: 20
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    });

    test("User should not be able to move into an element", async () => {
        ws2.send(JSON.stringify({
            type: "move",
            payload: {
                x: 20,
                y: 20
            }
        }));

        const message = await waitForAndPopLatestMessage(ws2Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(userX);
        expect(message.payload.y).toBe(userY);
    });

    afterAll(() => {
        if (ws1) ws1.close();
        if (ws2) ws2.close();
    });
});
