# Connections

Vector Watcher uses connections to access supported databases or data sources.

This page describes the general connection workflow.

---

## Creating a Connection

> 📷 Screenshot placeholder: Create connection screen

![Create Connection](screenshots/connection-tab.png)

To create a connection:

1. Open the connection section.
2. Enter the required connection information.
3. Save or connect using the available action.

---

## Connection Fields

The application may require connection information such as:

- Connection name
- Database location or URI
- Storage configuration
- Endpoint
- Credentials
- Other connection-specific settings

---

## Storing Credentials in Vault

After configuring a connection, you can se the connection using master password and these credentials will be stoared in your system

![Save Connection Vault](screenshots/save-connection.png)

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

- [Saved Connections](./Saved-Connection.md)
- [Database Explorer](./Database-Explorer.md)
- [Troubleshooting](./Troubleshooting.md)
