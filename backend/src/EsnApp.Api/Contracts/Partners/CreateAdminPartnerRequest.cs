using Microsoft.AspNetCore.Http;

namespace EsnApp.Api.Contracts.Partners;

public class CreateAdminPartnerRequest
{
    public required string Name { get; init; }
    public required string ShortDescription { get; init; }
    public required string Description { get; init; }
    public required IFormFile Logo { get; init; }
    public string? Address { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? GoogleMapsUrl { get; init; }
    public decimal? Latitude { get; init; }
    public decimal? Longitude { get; init; }
}

public class UpdateAdminPartnerRequest
{
    public required string Name { get; init; }
    public required string ShortDescription { get; init; }
    public required string Description { get; init; }
    public IFormFile? Logo { get; init; }
    public string? Address { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? GoogleMapsUrl { get; init; }
    public decimal? Latitude { get; init; }
    public decimal? Longitude { get; init; }
}
