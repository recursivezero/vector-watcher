# Connections

Vector Watcher uses connections to access supported databases or data sources.

This page describes the general connection workflow.

---

## Creating a Connection

> 📷 Screenshot placeholder: Create connection screen

<!--
![Create Connection](images/create-connection.png)
-->

To create a connection:

1. Open the connection section.
2. Enter the required connection information.
3. Save or connect using the available action.

> TODO: Document the exact fields currently supported by Vector Watcher.

---

## Connection Fields

The application may require connection information such as:

* Connection name
* Database location or URI
* Storage configuration
* Endpoint
* Credentials
* Other connection-specific settings

> TODO: Replace this section with the exact fields used by the current Vector Watcher UI.

---

## Connecting

After configuring a connection, select the connection and connect to the database.

> 📷 Screenshot placeholder: Connected application state

<!--
![Connected State](images/connected-state.png)
-->

When successfully connected, Vector Watcher should make the available database resources accessible through the application.

---

## Connection Errors

If a connection fails:

1. Verify the connection information.
2. Verify that the database or storage location is accessible.
3. Verify any required credentials.
4. Check the application error message.
5. Review [[Troubleshooting]].

---

## Related Documentation

* [[Saved Connections]]
* [[Database Explorer]]
* [[Troubleshooting]]

---

## Future Documentation

> TODO: Add supported database types.

> TODO: Add local database examples.

> TODO: Add cloud database examples.

> TODO: Add connection validation behavior.

> TODO: Add connection error reference.
