# kaholo-plugin-outreach
Outreach plugin for Kaholo. Based on the (Outreach API documentation)[https://api.outreach.io/api/v2/docs]

## Settings:
* Email - the email of the user to authenticate with
* Password - the password of the user to authenticate with
* Clinet Id - Client ID for interacting with Outreach API.
* Client Secret - Client Secret for interacting with Outreach API
* Redirect URI - Outreach auth redirect URI.

## Method: Add Prospect

**Description**

Creates a new prospect. Requires user to have `prospects.write` permissions.

**Parameters**
* Email - The email of the prospect.
* Company - The company the prospect works for
* First Name
* Last Name 
* Work Phone
* Custom Field 1 - Value for Outreach's custome field 1.
* Owner - the id of the owner to attach the prospect to.