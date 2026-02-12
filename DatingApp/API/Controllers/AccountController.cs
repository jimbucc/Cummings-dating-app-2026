using System.Security.Cryptography;
using System.Text;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountController(AppDbContext context, ITokenService tokenService) : BaseApiController
{
    [HttpPost("register")]  // api/account/register
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
        if(await EmailExists(registerDto.Email))
            return BadRequest("Email taken");

        // dispose of hmac after its use in this function
        using var hmac = new HMACSHA512();

        var user = new AppUser
        {
            DisplayName = registerDto.DisplayName,
            Email = registerDto.Email,
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(registerDto.Password)),
            PasswordSalt = hmac.Key
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user.ToDto(tokenService);

        // return new UserDto
        // {
        //     Id = user.Id,
        //     Email = user.Email,
        //     DisplayName = user.DisplayName,
        //     Token = tokenService.CreateToken(user)
        // };
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await context.Users.SingleOrDefaultAsync(x => x.Email == loginDto.Email);
        if(user == null)
            return Unauthorized("User email is invalid");

        using var hmac = new HMACSHA512(user.PasswordSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));
        
        // Compare hashes - bail if different - handles a bad passsword
        if(!computedHash.SequenceEqual(user.PasswordHash))
            return Unauthorized("Invalid Password");

        // Compare byte for byte
        // for (var i=0; i < computedHash.Length; i++)
        // {
        //     if(computedHash[i] != user.PasswordHash[i]) return Unauthorized("Invalid Password");
        // }

        // password is good.

        return user.ToDto(tokenService);

        // return new UserDto
        // {
        //     Id = user.Id,
        //     Email = user.Email,
        //     DisplayName = user.DisplayName,
        //     Token = tokenService.CreateToken(user)
        // };
    }

    private async Task<bool> EmailExists(string email) 
        => await context.Users.AnyAsync(x => x.Email.ToLower() == email.ToLower());
}
