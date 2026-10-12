# Email Templates Structure

This directory contains modular email templates for the notification system with separate header and footer components using EJS partials.

## Structure

```
templates/
├── sections/
│   ├── header.html            # Header with complete HTML structure and logo
│   └── footer.html            # Footer with closing tags, address and social links
├── email-verification.html    # Email verification template
└── README.md                  # This documentation
```

## Usage

### Header and Footer Partials
- `sections/header.html` contains the complete HTML structure (doctype, html, head, body start)
- `sections/footer.html` contains the closing tags (body, html end) and footer content
- Both are included using EJS partials: `<%- include('sections/header') %>` and `<%- include('sections/footer') %>`

### Email Templates
- Templates only contain the specific content between header and footer
- Use EJS template variables like `<%=VERIFICATION_CODE %>` for dynamic content
- Structure: Header include → Content → Footer include

## Template Variables

- `<%=VERIFICATION_CODE %>` - 6-digit verification code
- `{{EMAIL_SUBJECT}}` - Email subject for the title tag (in header)

## Creating New Templates

1. Create a new HTML file in the templates directory
2. Include the header: `<%- include('sections/header') %>`
3. Add your specific content with appropriate template variables
4. Include the footer: `<%- include('sections/footer') %>`

Example structure:
```html
<%- include('sections/header') %>

<!-- Your specific content here -->
<table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
        <td style="text-align: center;">
            <h2>Your Content Title</h2>
            <p>Your content with <%=VARIABLE %></p>
        </td>
    </tr>
</table>

<%- include('sections/footer') %>
```

## Benefits of This Structure

- **Single Source of Truth**: Header and footer changes only need to be made in one file
- **Consistent Branding**: All templates automatically inherit header and footer updates
- **Easy Maintenance**: No need to update multiple template files when making header/footer changes
- **Clean Templates**: Content templates focus only on the specific message content
- **Modular Design**: Header contains full HTML structure, footer contains closing tags and footer content

## Email Clients Compatibility

All templates use table-based layout for maximum email client compatibility:
- No flexbox or grid layouts
- Inline CSS styles
- Table-based structure
- Fallback styling for older clients
