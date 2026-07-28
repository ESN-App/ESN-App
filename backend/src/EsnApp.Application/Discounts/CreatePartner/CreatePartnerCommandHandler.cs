using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using EsnApp.Domain.Discounts;
using MediatR;

namespace EsnApp.Application.Discounts.CreatePartner;

public class CreatePartnerCommandHandler(IPartnerRepository repository)
    : IRequestHandler<CreatePartnerCommand, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        CreatePartnerCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new Partner
        {
            Name = request.Name,
            LogoPath = request.LogoPath,
            ShortDescription = request.ShortDescription,
            Description = request.Description,
            Address = request.Address,
            WebsiteUrl = request.WebsiteUrl,
            GoogleMapsUrl = request.GoogleMapsUrl,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(created.ToDto());
    }
}
