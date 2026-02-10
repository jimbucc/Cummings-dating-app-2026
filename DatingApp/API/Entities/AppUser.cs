using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Entities;

public class AppUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();   // use Guids as unique ids for users.  Used as primary key in db
    public required string DisplayName { get; set; }  // class cannot be created unless required fields are populated
    public required string  Email { get; set; }
}
