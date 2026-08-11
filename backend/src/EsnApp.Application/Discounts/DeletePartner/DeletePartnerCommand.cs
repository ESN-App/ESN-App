using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Discounts.DeletePartner;

public record DeletePartnerCommand(Guid Id) : IRequest<Result>;
